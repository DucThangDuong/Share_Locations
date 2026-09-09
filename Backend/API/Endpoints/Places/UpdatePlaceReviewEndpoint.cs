using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.DTOs.Places;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Reviews.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Places;

public class UpdatePlaceReviewEndpoint : Endpoint<UpdatePlaceReviewRequest, ApiSuccessResponse<ReviewItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/v1/reviews/{id}", "/api/reviews/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        AllowFileUploads();
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Chỉnh sửa bài đánh giá";
            s.Description = "Cập nhật điểm đánh giá, nội dung nhận xét, ngày ghé thăm và ảnh/video của bài đánh giá (chỉ người tạo hoặc quản trị viên).";
        });
    }

    public override async Task HandleAsync(UpdatePlaceReviewRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<ReviewItemDto>.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var isAdmin = User.IsInRole("SystemAdmin") || User.IsInRole("CategoryAdmin");

        var photoUploads = req.Photos?
            .Where(f => f.Length > 0)
            .Select(f => new FileUploadModel(f.OpenReadStream(), f.FileName, f.ContentType))
            .ToList();

        var videoUploads = req.Videos?
            .Where(f => f.Length > 0)
            .Select(f => new FileUploadModel(f.OpenReadStream(), f.FileName, f.ContentType))
            .ToList();

        var result = await Mediator.Send(
            new UpdatePlaceReviewCommand(
                req.Id,
                userId,
                isAdmin,
                req.Rating,
                req.Content,
                req.VisitDate,
                photoUploads,
                videoUploads,
                req.ExistingMediaUrls),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
