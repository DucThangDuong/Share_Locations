using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Proposals;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Proposals;

public class ApproveAdminProposalRequest
{
    public long Id { get; set; }
    public long? TargetPlaceId { get; set; }
}

public class ApproveAdminProposalEndpoint : Endpoint<ApproveAdminProposalRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/proposals/{id}/approve");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Phê duyệt đề xuất đóng góp (Admin)";
            s.Description = "Phê duyệt đề xuất tạo mới hoặc cập nhật địa điểm của người dùng.";
        });
    }

    public override async Task HandleAsync(ApproveAdminProposalRequest req, CancellationToken ct)
    {
        var adminId = this.GetUserId();
        if (!adminId.HasValue)
        {
            await this.SendApiResponseAsync(Result<bool>.Unauthorized("Bạn cần đăng nhập bằng tài khoản quản trị."), ct);
            return;
        }

        var result = await Mediator.Send(new ApproveAdminProposalCommand(req.Id, adminId.Value, req.TargetPlaceId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
