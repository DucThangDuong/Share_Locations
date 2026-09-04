using API.DTOs;
using API.DTOs.Places;
using API.Extensions;
using Application.DTOs;
using Application.Features.Places.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class SearchPlacesEndpoint : Endpoint<SearchPlacesRequest, ApiSuccessResponse<IReadOnlyList<PlaceSummaryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/places", "/api/places");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
    }

    public override async Task HandleAsync(SearchPlacesRequest req, CancellationToken ct)
    {
        var filterParams = new PlaceFilterParams
        {
            Keyword = req.Keyword,
            RegionId = req.RegionId,
            ProvinceId = req.ProvinceId,
            CategoryId = req.CategoryId,
            PlaceTypeId = req.PlaceTypeId,
            MinPrice = req.MinPrice,
            MaxPrice = req.MaxPrice,
            MinRating = req.MinRating,
            SortBy = req.SortBy,
            Page = req.Page,
            PageSize = req.PageSize
        };

        var result = await Mediator.Send(new SearchPlacesQuery(filterParams), ct);
        await this.SendPagedApiResponseAsync(result, ct);
    }
}
