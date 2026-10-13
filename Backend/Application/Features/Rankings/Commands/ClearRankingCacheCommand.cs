using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.Rankings.Commands;

public record ClearRankingCacheCommand() : IRequest<Result<bool>>;

public class ClearRankingCacheCommandHandler : IRequestHandler<ClearRankingCacheCommand, Result<bool>>
{
    private readonly ICacheService _cacheService;
    private readonly ICurrentUserService _currentUserService;

    public ClearRankingCacheCommandHandler(ICacheService cacheService, ICurrentUserService currentUserService)
    {
        _cacheService = cacheService;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(ClearRankingCacheCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
        {
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền làm mới bộ nhớ đệm xếp hạng.", HttpStatusCode.Forbidden);
        }

        await _cacheService.RemoveByPatternAsync("rank:*", ct);
        return Result<bool>.Success(true, "Đã làm mới và giải phóng toàn bộ bộ nhớ đệm Bảng Xếp Hạng thành công.");
    }
}
