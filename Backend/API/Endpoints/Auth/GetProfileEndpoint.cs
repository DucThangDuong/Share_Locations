using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Auth.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Auth;

public class GetProfileEndpoint : EndpointWithoutRequest<ApiSuccessResponse<UserDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/auth/profile");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
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
