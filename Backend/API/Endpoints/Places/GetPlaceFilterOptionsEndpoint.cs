using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Places.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class GetPlaceFilterOptionsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<PlaceFilterOptionsDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/places/filter-options");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPlaceFilterOptionsQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
