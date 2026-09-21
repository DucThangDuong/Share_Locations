using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Proposals;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Proposals;

public class RejectAdminProposalRequest
{
    public long Id { get; set; }
    public string RejectionReason { get; set; } = string.Empty;
}

public class RejectAdminProposalEndpoint : Endpoint<RejectAdminProposalRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/proposals/{id}/reject");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Từ chối đề xuất đóng góp (Admin)";
            s.Description = "Từ chối đề xuất đóng góp của người dùng kèm lý do phản hồi.";
        });
    }

    public override async Task HandleAsync(RejectAdminProposalRequest req, CancellationToken ct)
    {
        var adminId = this.GetUserId();
        if (!adminId.HasValue)
        {
            await this.SendApiResponseAsync(Result<bool>.Unauthorized("Bạn cần đăng nhập bằng tài khoản quản trị."), ct);
            return;
        }

        var result = await Mediator.Send(new RejectAdminProposalCommand(req.Id, adminId.Value, req.RejectionReason), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
