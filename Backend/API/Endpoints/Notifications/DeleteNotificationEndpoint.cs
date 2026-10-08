using API.DTOs;
using API.Extensions;
using Application.Features.Notifications;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Notifications;

public class DeleteNotificationApiRequest
{
    public long Id { get; set; }
}

public class DeleteNotificationEndpoint : Endpoint<DeleteNotificationApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/notifications/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Summary(s =>
        {
            s.Summary = "Xóa (lưu trữ) một thông báo";
            s.Description = "Đánh dấu lưu trữ thông báo để không còn xuất hiện trong danh sách hiển thị.";
        });
    }

    public override async Task HandleAsync(DeleteNotificationApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteNotificationCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
