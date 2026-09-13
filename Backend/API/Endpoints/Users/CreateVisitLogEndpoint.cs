using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class CreateVisitLogEndpoint : Endpoint<CreateVisitLogRequestDto, ApiSuccessResponse<UserVisitLogItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/users/me/visit-logs", "/api/users/me/visit-logs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Thêm địa điểm vào nhật ký hành trình";
            s.Description = "Ghi nhận một địa điểm đã từng ghé thăm vào nhật ký cá nhân.";
        });
    }

    public override async Task HandleAsync(CreateVisitLogRequestDto req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserVisitLogItemDto>.Unauthorized("Bạn cần đăng nhập để thêm nhật ký."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new CreateVisitLogCommand(userId.Value, req.PlaceId, req.VisitedDate, req.Privacy),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
