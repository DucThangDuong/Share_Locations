using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Catalog.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Catalog;

public class GetPlaceTypesEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<PlaceTypeDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/place-types", "/api/place-types");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPlaceTypesQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
