using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Users;

public class GetUserProfileRequest
{
    public string? UserId { get; set; }
}

public class GetUserProfileEndpoint : Endpoint<GetUserProfileRequest, ApiSuccessResponse<UserProfileDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/{UserId}/profile");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy thông tin hồ sơ người dùng";
            s.Description = "Lấy thông tin cá nhân, tiểu sử, điểm uy tín, trạng thái bạn bè và số lượng thống kê theo từng tab.";
        });
    }

    public override async Task HandleAsync(GetUserProfileRequest req, CancellationToken ct)
    {
        var currentUserId = this.GetUserId();
        long targetUserId;

        if (string.IsNullOrWhiteSpace(req.UserId) || string.Equals(req.UserId, "me", StringComparison.OrdinalIgnoreCase))
        {
            if (!currentUserId.HasValue)
            {
                await this.SendApiResponseAsync(
                    Result<UserProfileDetailDto>.Unauthorized("Bạn cần đăng nhập để xem hồ sơ của mình."),
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
                Result<UserProfileDetailDto>.Failure("Mã người dùng không hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(new GetUserProfileQuery(targetUserId, currentUserId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
