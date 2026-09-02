using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Geography.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Geography;

public class GetRegionsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<RegionDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/regions");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRegionsQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
