using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Users;

public class GetUserMapPlacesRequest
{
    public string? UserId { get; set; }
}

public class GetUserMapPlacesEndpoint : Endpoint<GetUserMapPlacesRequest, ApiSuccessResponse<IReadOnlyList<UserMapPlaceDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/{UserId}/map-places");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy tọa độ bản đồ dấu chân du lịch của người dùng";
            s.Description = "Tổng hợp tọa độ các điểm đến từ bài đánh giá, nhật ký ghé thăm và địa điểm đề xuất đã duyệt.";
        });
    }

    public override async Task HandleAsync(GetUserMapPlacesRequest req, CancellationToken ct)
    {
        var currentUserId = this.GetUserId();
        long targetUserId;

        if (string.IsNullOrWhiteSpace(req.UserId) || string.Equals(req.UserId, "me", StringComparison.OrdinalIgnoreCase))
        {
            if (!currentUserId.HasValue)
            {
                await this.SendApiResponseAsync(
                    Result<IReadOnlyList<UserMapPlaceDto>>.Unauthorized("Bạn cần đăng nhập để xem bản đồ của mình."),
                    ct);
                return;
            }
            targetUserId = currentUserId.Value;
        }
        else if (long.TryParse(req.UserId, out var parsedId))
        {
            targetUserId = parsedId;
        }
        else
        {
            await this.SendApiResponseAsync(
                Result<IReadOnlyList<UserMapPlaceDto>>.Failure("Mã người dùng không hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(new GetUserMapPlacesQuery(targetUserId, currentUserId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
