using API.Extensions;
using Application.Common;
using Application.Features.Places.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Places;

public class RecordAccessHistoryRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class RecordAccessHistoryEndpoint : Endpoint<RecordAccessHistoryRequest>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/places/{id}/access-history", "/api/places/{id}/access-history");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Ghi nhận lịch sử truy cập địa điểm";
            s.Description = "Ghi nhận địa điểm người dùng đã xem vào lịch sử gần đây.";
        });
    }

    public override async Task HandleAsync(RecordAccessHistoryRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để ghi nhận lịch sử."),
                ct);
            return;
        }

        var result = await Mediator.Send(new RecordAccessHistoryCommand(req.Id, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
