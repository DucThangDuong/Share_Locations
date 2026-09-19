using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Trips.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Friends;

public class GetFriendPublicTripsRequest
{
    public long UserId { get; set; }
}

public class GetFriendPublicTripsEndpoint : Endpoint<GetFriendPublicTripsRequest, ApiSuccessResponse<IReadOnlyList<PublicTripSummaryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/{userId}/trips/public");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Xem danh sách chuyến đi công khai của người dùng / bạn bè";
            s.Description = "Lấy các chuyến đi ở chế độ công khai (Privacy = Public) của người dùng chỉ định.";
        });
    }

    public override async Task HandleAsync(GetFriendPublicTripsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetUserPublicTripsQuery(req.UserId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
