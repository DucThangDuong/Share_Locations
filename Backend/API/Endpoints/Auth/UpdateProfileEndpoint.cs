using System.Security.Claims;
using API.DTOs;
using API.DTOs.Auth;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class UpdateProfileEndpoint : Endpoint<UpdateProfileRequest, ApiSuccessResponse<UserDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/auth/profile");
        Summary(s =>
        {
            s.Summary = "Update current user profile";
            s.Description = "Updates profile details (Full name, phone, avatar, cover, bio) for the authenticated user.";
        });
    }

    public override async Task HandleAsync(UpdateProfileRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<UserDto>.Unauthorized("Không tìm thấy thông tin xác thực hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(new UpdateProfileCommand(
            userId,
            req.FullName,
            req.Phone,
            req.AvatarUrl,
            req.CoverUrl,
            req.Bio), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
