using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Queries;

public record GetPlaceReviewsQuery(
    long PlaceId,
    int Page = 1,
    int PageSize = 10,
    int? Rating = null) : IRequest<Result<PlaceReviewSummaryDto>>;

public class GetPlaceReviewsQueryHandler : IRequestHandler<GetPlaceReviewsQuery, Result<PlaceReviewSummaryDto>>
{
    private readonly IPlaceRepository _placeRepository;

    public GetPlaceReviewsQueryHandler(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<PlaceReviewSummaryDto>> Handle(GetPlaceReviewsQuery request, CancellationToken ct)
    {
        var summary = await _placeRepository.GetPlaceReviewsAsync(
            request.PlaceId,
            request.Page,
            request.PageSize,
            request.Rating,
            ct);

        return Result<PlaceReviewSummaryDto>.Success(summary);
    }
}
