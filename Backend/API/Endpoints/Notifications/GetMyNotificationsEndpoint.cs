using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Notifications;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Notifications;

public class GetMyNotificationsApiRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? UnreadOnly { get; set; }
}

public class GetMyNotificationsEndpoint : Endpoint<GetMyNotificationsApiRequest, ApiSuccessResponse<NotificationPagedResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/notifications");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Summary(s =>
        {
            s.Summary = "Lấy danh sách thông báo của người dùng hiện tại";
            s.Description = "Hỗ trợ phân trang và lọc thông báo chưa đọc. Tự động trả kèm số lượng chưa đọc.";
        });
    }

    public override async Task HandleAsync(GetMyNotificationsApiRequest req, CancellationToken ct)
    {
        var query = new GetMyNotificationsQuery(req.Page, req.PageSize, req.UnreadOnly);
        var result = await Mediator.Send(query, ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
