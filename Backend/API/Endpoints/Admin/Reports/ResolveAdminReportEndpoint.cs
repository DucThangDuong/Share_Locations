using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Reports;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Reports;

public class ResolveAdminReportRequest
{
    public long Id { get; set; }
    public string TargetType { get; set; } = "review";
    public string Decision { get; set; } = "accept";
    public string? ActionTaken { get; set; }
    public string? ResolutionNote { get; set; }
}

public class ResolveAdminReportEndpoint : Endpoint<ResolveAdminReportRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/reports/{id}/resolve");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Ra quyết định giải quyết báo cáo vi phạm (Admin)";
            s.Description = "Xác nhận vi phạm (ẩn/xóa nội dung, tính lại rating) hoặc bác bỏ báo cáo.";
        });
    }

    public override async Task HandleAsync(ResolveAdminReportRequest req, CancellationToken ct)
    {
        var adminId = this.GetUserId();
        if (!adminId.HasValue)
        {
            await this.SendApiResponseAsync(Result<bool>.Unauthorized("Bạn cần đăng nhập bằng tài khoản quản trị."), ct);
            return;
        }

        var result = await Mediator.Send(
            new ResolveAdminReportCommand(
                req.TargetType,
                req.Id,
                adminId.Value,
                req.Decision,
                req.ActionTaken,
                req.ResolutionNote),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
