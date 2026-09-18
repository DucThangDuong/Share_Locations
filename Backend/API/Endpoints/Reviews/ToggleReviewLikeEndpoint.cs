using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Reviews.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Reviews;

public class ToggleReviewLikeRequest
{
    public long Id { get; set; }
}

public class ToggleReviewLikeEndpoint : Endpoint<ToggleReviewLikeRequest, ApiSuccessResponse<ReviewLikeResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/reviews/{id}/toggle-like");
        Tags("Reviews");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Thả tim hoặc bỏ thích đánh giá";
            s.Description = "Người dùng nhấn thích hoặc bỏ thích đánh giá. Trả về trạng thái isLiked và tổng số lượt thích.";
        });
    }

    public override async Task HandleAsync(ToggleReviewLikeRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<ReviewLikeResponseDto>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var result = await Mediator.Send(new ToggleReviewLikeCommand(req.Id, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
