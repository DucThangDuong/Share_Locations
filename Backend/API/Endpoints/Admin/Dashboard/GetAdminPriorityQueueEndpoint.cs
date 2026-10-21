using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Dashboard;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Dashboard;

public class GetAdminPriorityQueueRequest
{
    public string? Filter { get; set; } = "all";
    public int Limit { get; set; } = 5;
}

public class GetAdminPriorityQueueEndpoint : Endpoint<GetAdminPriorityQueueRequest, ApiSuccessResponse<IReadOnlyList<PriorityQueueItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/dashboard/priority-queue");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách hàng đợi các tác vụ khẩn cấp (Priority Queue)";
            s.Description = "Tổng hợp các tác vụ cần ưu tiên từ Đề xuất, Báo cáo và Đánh giá tiêu cực theo filter (all, urgent, proposals, reports).";
        });
    }

    public override async Task HandleAsync(GetAdminPriorityQueueRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminPriorityQueueQuery(req.Filter, req.Limit), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
