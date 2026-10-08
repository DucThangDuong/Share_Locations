using API.DTOs;
using API.Extensions;
using Application.Features.Notifications;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Notifications;

public class MarkAllNotificationsAsReadEndpoint : EndpointWithoutRequest<ApiSuccessResponse<int>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/notifications/read-all");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Summary(s =>
        {
            s.Summary = "Đánh dấu tất cả thông báo là đã đọc";
            s.Description = "Cập nhật toàn bộ thông báo chưa đọc thành đã đọc và reset badge đếm về 0.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new MarkAllNotificationsAsReadCommand(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
