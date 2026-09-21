using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Reports;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Reports;

public class GetMyReportsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<ReportQueueItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/reports/my-reports");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xem lịch sử báo cáo của tôi";
            s.Description = "Lấy danh sách các phản ánh vi phạm do tài khoản hiện tại gửi lên và trạng thái xử lý.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result<IReadOnlyList<ReportQueueItemDto>>.Unauthorized("Bạn cần đăng nhập để xem lịch sử báo cáo."), ct);
            return;
        }

        var result = await Mediator.Send(new GetMyReportsQuery(userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
