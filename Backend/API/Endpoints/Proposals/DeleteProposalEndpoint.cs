using API.Extensions;
using Application.Common;
using Application.Features.Proposals.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Proposals;

public class DeleteProposalRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class DeleteProposalEndpoint : Endpoint<DeleteProposalRequest>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/v1/proposals/{id}", "/api/proposals/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Thu hồi đề xuất địa điểm";
            s.Description = "Người dùng thu hồi hoặc xóa bỏ đề xuất chưa duyệt hoặc đã bị từ chối.";
        });
    }

    public override async Task HandleAsync(DeleteProposalRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thao tác."),
                ct);
            return;
        }

        var result = await Mediator.Send(new DeleteProposalCommand(req.Id, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
