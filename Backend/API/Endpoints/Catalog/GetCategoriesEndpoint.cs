using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Catalog.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Catalog;

public class GetCategoriesRequest
{
    [QueryParam]
    public int? PlaceTypeId { get; set; }

    [QueryParam]
    public int PlacesPerCategory { get; set; } = 6;
}

public class GetCategoriesEndpoint : Endpoint<GetCategoriesRequest, ApiSuccessResponse<IReadOnlyList<CategoryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/categories", "/api/categories");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
    }

    public override async Task HandleAsync(GetCategoriesRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCategoriesQuery(req.PlaceTypeId, req.PlacesPerCategory), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
