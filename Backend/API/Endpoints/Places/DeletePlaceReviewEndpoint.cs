using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Reviews.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Places;

public class DeletePlaceReviewRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class DeletePlaceReviewEndpoint : Endpoint<DeletePlaceReviewRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/reviews/{id}", "/api/places/{placeId}/reviews/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa bài đánh giá";
            s.Description = "Xóa bài đánh giá, tự động xóa các bình luận bên trong và tính toán lại điểm sao trung bình, số lượng đánh giá của địa điểm (chỉ người tạo hoặc quản trị viên).";
        });
    }

    public override async Task HandleAsync(DeletePlaceReviewRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<bool>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var isAdmin = User.IsInRole("SystemAdmin") || User.IsInRole("CategoryAdmin");

        var result = await Mediator.Send(
            new DeletePlaceReviewCommand(req.Id, userId, isAdmin),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
