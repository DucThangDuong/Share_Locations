using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.DTOs.Places;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Places.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Places;

public class CreatePlaceReviewEndpoint : Endpoint<CreatePlaceReviewRequest, ApiSuccessResponse<ReviewItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/places/{id}/reviews", "/api/places/{id}/reviews");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
    }

    public override async Task HandleAsync(CreatePlaceReviewRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<ReviewItemDto>.Unauthorized("Bạn cần đăng nhập để gửi đánh giá."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new CreatePlaceReviewCommand(
                req.Id,
                userId,
                req.Rating,
                req.Content,
                req.VisitDate,
                req.Images),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
