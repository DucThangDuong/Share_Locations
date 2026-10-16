using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record GetRecommendedPlacesQuery(long? UserId = null, int Limit = 5) : IRequest<Result<IReadOnlyList<PlaceRecommendationDto>>>;

public class GetRecommendedPlacesQueryHandler : IRequestHandler<GetRecommendedPlacesQuery, Result<IReadOnlyList<PlaceRecommendationDto>>>
{
    private readonly IRecommendationService _recommendationService;

    public GetRecommendedPlacesQueryHandler(IRecommendationService recommendationService)
    {
        _recommendationService = recommendationService;
    }

    public async Task<Result<IReadOnlyList<PlaceRecommendationDto>>> Handle(
        GetRecommendedPlacesQuery request,
        CancellationToken ct)
    {
        var safeLimit = request.Limit is > 0 and <= 50 ? request.Limit : 5;

        var items = await _recommendationService.GetRecommendationsForUserAsync(
            request.UserId, safeLimit, null, null, ct);

        var list = items.Select(x => new PlaceRecommendationDto
        {
            Id = x.PlaceId,
            Name = x.Name,
            Address = x.Address,
            CategoryId = x.CategoryId,
            CategoryName = x.CategoryName,
            ProvinceId = x.ProvinceId,
            ProvinceName = x.ProvinceName,
            CoverImageUrl = x.CoverImageUrl,
            MinPrice = x.MinPrice,
            MaxPrice = x.MaxPrice,
            AvgRating = x.AvgRating,
            ReviewCount = x.ReviewCount,
            MatchPercentage = x.MatchPercentage
        }).ToList();

        return Result<IReadOnlyList<PlaceRecommendationDto>>.Success(list);
    }
}
