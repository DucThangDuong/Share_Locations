using API.DTOs;
using API.Extensions;
using Application.Features.Notifications;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Notifications;

public class MarkNotificationAsReadApiRequest
{
    public long Id { get; set; }
}

public class MarkNotificationAsReadEndpoint : Endpoint<MarkNotificationAsReadApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/notifications/{id}/read");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Summary(s =>
        {
            s.Summary = "Đánh dấu một thông báo là đã đọc";
            s.Description = "Cập nhật trạng thái thông báo và đồng bộ số lượng chưa đọc realtime qua SignalR.";
        });
    }

    public override async Task HandleAsync(MarkNotificationAsReadApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new MarkNotificationAsReadCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
