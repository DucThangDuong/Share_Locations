using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetReputationHistoryQuery(
    long UserId,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<PagedResult<ReputationLogDto>>>;

public class GetReputationHistoryQueryHandler : IRequestHandler<GetReputationHistoryQuery, Result<PagedResult<ReputationLogDto>>>
{
    private readonly IReputationService _reputationService;

    public GetReputationHistoryQueryHandler(IReputationService reputationService)
    {
        _reputationService = reputationService;
    }

    public async Task<Result<PagedResult<ReputationLogDto>>> Handle(GetReputationHistoryQuery request, CancellationToken ct)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        var history = await _reputationService.GetUserHistoryAsync(request.UserId, page, pageSize, ct);
        return Result<PagedResult<ReputationLogDto>>.Success(history, "Lấy lịch sử điểm uy tín thành công.");
    }
}
