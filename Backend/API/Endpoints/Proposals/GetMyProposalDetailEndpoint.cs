using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Proposals.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Proposals;

public class GetMyProposalDetailRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class GetMyProposalDetailEndpoint : Endpoint<GetMyProposalDetailRequest, ApiSuccessResponse<UserProposalItemDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/proposals/{id:long}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết đề xuất địa điểm của tôi";
            s.Description = "Chỉ cho phép người dùng xem chi tiết đề xuất địa điểm do chính mình gửi.";
        });
    }

    public override async Task HandleAsync(GetMyProposalDetailRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserProposalItemDto>.Unauthorized("Bạn cần đăng nhập để xem chi tiết đề xuất."),
                ct);
            return;
        }

        var result = await Mediator.Send(new GetMyProposalDetailQuery(req.Id, userId.Value), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
