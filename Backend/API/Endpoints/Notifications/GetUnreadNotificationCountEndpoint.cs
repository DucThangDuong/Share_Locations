using API.DTOs;
using API.Extensions;
using Application.Features.Notifications;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Notifications;

public class GetUnreadNotificationCountEndpoint : EndpointWithoutRequest<ApiSuccessResponse<int>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/notifications/unread-count");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Summary(s =>
        {
            s.Summary = "Lấy số lượng thông báo chưa đọc của người dùng hiện tại";
            s.Description = "Endpoint siêu nhẹ được cache để hiển thị badge số đếm trên thanh thông báo.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetMyUnreadNotificationCountQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
