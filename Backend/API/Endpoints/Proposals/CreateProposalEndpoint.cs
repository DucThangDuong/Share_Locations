using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Proposals.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Proposals;

public class CreateProposalEndpoint : Endpoint<CreateProposalRequestDto, ApiSuccessResponse<UserProposalItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/proposals", "/api/proposals");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Gửi đề xuất địa điểm mới";
            s.Description = "Gửi đề xuất thêm một địa điểm du lịch, ẩm thực mới lên hệ thống để ban quản trị duyệt.";
        });
    }

    public override async Task HandleAsync(CreateProposalRequestDto req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserProposalItemDto>.Unauthorized("Bạn cần đăng nhập để gửi đề xuất địa điểm."),
                ct);
            return;
        }

        var result = await Mediator.Send(new CreateProposalCommand(userId.Value, req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
