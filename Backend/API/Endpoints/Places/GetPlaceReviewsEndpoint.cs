using API.DTOs;
using API.DTOs.Places;
using API.Extensions;
using Application.DTOs;
using Application.Features.Places.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class GetPlaceReviewsEndpoint : Endpoint<GetPlaceReviewsRequest, ApiSuccessResponse<PlaceReviewSummaryDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/places/{id}/reviews", "/api/places/{id}/reviews");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
    }

    public override async Task HandleAsync(GetPlaceReviewsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetPlaceReviewsQuery(req.Id, req.Page, req.PageSize, req.Rating),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
