using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class GetUserProposalsRequest
{
    [QueryParam]
    public int? Status { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 12;
}

public class GetUserProposalsEndpoint : Endpoint<GetUserProposalsRequest, ApiSuccessResponse<UserProposalPagedResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/proposals", "/api/users/me/proposals");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách đề xuất của tôi";
            s.Description = "Lấy danh sách các địa điểm mới mà người dùng hiện tại đã đề xuất cho hệ thống xét duyệt.";
        });
    }

    public override async Task HandleAsync(GetUserProposalsRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserProposalPagedResultDto>.Unauthorized("Bạn cần đăng nhập để xem đề xuất."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserProposalsQuery(userId.Value, req.Status, req.Page, req.PageSize),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
