using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.DTOs.Places;
using API.Extensions;
using Application.Common;
using Application.Features.Places.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Places;

public class CreatePlaceReportEndpoint : Endpoint<CreatePlaceReportRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/places/{id}/reports");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Gửi báo cáo vi phạm địa điểm";
            s.Description = "Gửi phản ánh hoặc báo cáo vi phạm (thông tin sai lệch, địa điểm đóng cửa, hình ảnh không phù hợp) của một địa điểm đến quản trị viên.";
        });
    }

    public override async Task HandleAsync(CreatePlaceReportRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var reporterId) || reporterId <= 0)
        {
            await this.SendApiResponseAsync(Result<bool>.Unauthorized("Bạn cần đăng nhập để gửi báo cáo vi phạm."), ct);
            return;
        }

        var result = await Mediator.Send(
            new CreatePlaceReportCommand(
                req.Id,
                req.Reason,
                req.Description,
                req.ContactEmail,
                reporterId),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
