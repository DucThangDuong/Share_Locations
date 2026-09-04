using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Catalog.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Catalog;

public class GetFeaturedCollectionsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<List<CollectionDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/collections/featured", "/api/collections/featured");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetFeaturedCollectionsQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
