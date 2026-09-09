using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.DTOs.Places;
using API.Extensions;
using Application.Features.Places.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Places;

public class CreatePlaceReportEndpoint : Endpoint<CreatePlaceReportRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/places/{id}/reports", "/api/places/{id}/reports");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Gửi báo cáo vi phạm địa điểm";
            s.Description = "Gửi phản ánh hoặc báo cáo vi phạm (thông tin sai lệch, địa điểm đóng cửa, hình ảnh không phù hợp) của một địa điểm đến quản trị viên.";
        });
    }

    public override async Task HandleAsync(CreatePlaceReportRequest req, CancellationToken ct)
    {
        long? reporterId = null;
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (long.TryParse(userIdStr, out var uid))
        {
            reporterId = uid;
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
