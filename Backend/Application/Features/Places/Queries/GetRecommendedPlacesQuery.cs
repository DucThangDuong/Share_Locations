using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record GetRecommendedPlacesQuery(long? UserId = null, int Limit = 5) : IRequest<Result<IReadOnlyList<PlaceRecommendationDto>>>;

public class GetRecommendedPlacesQueryHandler : IRequestHandler<GetRecommendedPlacesQuery, Result<IReadOnlyList<PlaceRecommendationDto>>>
{
    private readonly IRecommendationRepository _recommendationRepository;
    private readonly IKnnRecommendationService _knnService;
    private readonly ICacheService _cacheService;

    public GetRecommendedPlacesQueryHandler(
        IRecommendationRepository recommendationRepository,
        IKnnRecommendationService knnService,
        ICacheService cacheService)
    {
        _recommendationRepository = recommendationRepository;
        _knnService = knnService;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<PlaceRecommendationDto>>> Handle(
        GetRecommendedPlacesQuery request,
        CancellationToken ct)
    {
        var safeLimit = request.Limit is > 0 and <= 50 ? request.Limit : 5;
        var cacheKey = $"places:recommendations:{request.UserId ?? 0}:{safeLimit}";

        var cached = await _cacheService.GetAsync<IReadOnlyList<PlaceRecommendationDto>>(cacheKey, ct);
        if (cached != null && cached.Count > 0)
        {
            return Result<IReadOnlyList<PlaceRecommendationDto>>.Success(cached);
        }

        var allPlaces = await _recommendationRepository.GetAllCandidatePlacesAsync(ct);
        var allReviews = await _recommendationRepository.GetAllReviewsAsync(ct);

        var recommendations = _knnService.RecommendPlacesForUser(
            request.UserId,
            allPlaces,
            allReviews,
            safeLimit);

        if (recommendations.Count > 0)
        {
            await _cacheService.SetAsync(cacheKey, recommendations, TimeSpan.FromMinutes(15), ct);
        }

        return Result<IReadOnlyList<PlaceRecommendationDto>>.Success(recommendations);
    }
}
