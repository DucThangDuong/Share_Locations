using System.Security.Claims;
using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Auth.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class GetProfileEndpoint : EndpointWithoutRequest<ApiSuccessResponse<UserDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/auth/profile");
        Summary(s =>
        {
            s.Summary = "Get current user profile";
            s.Description = "Returns the profile details of the currently authenticated user based on JWT Bearer Token.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
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

        var result = await Mediator.Send(new GetProfileQuery(userId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
