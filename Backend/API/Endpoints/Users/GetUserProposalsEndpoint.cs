using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Users;

public class GetUserProposalsRequest
{
    public string? UserId { get; set; }

    [QueryParam]
    public int? Status { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 15;
}

public class GetUserProposalsEndpoint : Endpoint<GetUserProposalsRequest, ApiSuccessResponse<UserProposalPagedResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/{UserId}/proposals");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách đề xuất của người dùng";
            s.Description = "Lấy danh sách các địa điểm mà người dùng đề xuất cho hệ thống xét duyệt (hỗ trợ xem của chính mình hoặc người khác).";
        });
    }

    public override async Task HandleAsync(GetUserProposalsRequest req, CancellationToken ct)
    {
        var currentUserId = this.GetUserId();
        long targetUserId;

        if (string.IsNullOrWhiteSpace(req.UserId) || string.Equals(req.UserId, "me", StringComparison.OrdinalIgnoreCase))
        {
            if (!currentUserId.HasValue)
            {
                await this.SendApiResponseAsync(
                    Result<UserProposalPagedResultDto>.Unauthorized("Bạn cần đăng nhập để xem đề xuất của mình."),
                    ct);
                return;
            }
            targetUserId = currentUserId.Value;
        }
        else if (long.TryParse(req.UserId, out var parsedId))
        {
            targetUserId = parsedId;
        }
        else
        {
            await this.SendApiResponseAsync(
                Result<UserProposalPagedResultDto>.Failure("Mã người dùng không hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserProposalsQuery(targetUserId, currentUserId, req.Status, req.Page, req.PageSize),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
