using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Users;

public class GetReputationHistoryRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetReputationHistoryEndpoint : Endpoint<GetReputationHistoryRequest, ApiSuccessResponse<IReadOnlyList<ReputationLogDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/me/reputation-history");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy lịch sử biến động điểm uy tín";
            s.Description = "Lấy danh sách các lần cộng/trừ điểm uy tín kèm hành động, số điểm, số dư sau thay đổi và thời gian.";
        });
    }

    public override async Task HandleAsync(GetReputationHistoryRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<IReadOnlyList<ReputationLogDto>>.Unauthorized("Bạn cần đăng nhập để xem lịch sử điểm uy tín."),
                ct);
            return;
        }

        var result = await Mediator.Send(new GetReputationHistoryQuery(userId.Value, req.Page, req.PageSize), ct);
        await this.SendPagedApiResponseAsync(result, ct);
    }
}
