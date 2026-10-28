using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Rankings.Commands;

public record ClearRankingCacheCommand() : IRequest<Result<bool>>;

public class ClearRankingCacheCommandHandler : IRequestHandler<ClearRankingCacheCommand, Result<bool>>
{
    private readonly ICacheService _cacheService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRankingRepository _rankingRepository;

    public ClearRankingCacheCommandHandler(
        ICacheService cacheService,
        ICurrentUserService currentUserService,
        IRankingRepository rankingRepository)
    {
        _cacheService = cacheService;
        _currentUserService = currentUserService;
        _rankingRepository = rankingRepository;
    }

    public async Task<Result<bool>> Handle(ClearRankingCacheCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
        {
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền đồng bộ và tính toán lại Bảng Xếp Hạng.", HttpStatusCode.Forbidden);
        }

        await _rankingRepository.SnapshotCurrentRanksAsync(ct);
        await _cacheService.RemoveByPatternAsync("rank:*", ct);
        return Result<bool>.Success(true, "Đã đồng bộ và tính toán lại toàn bộ Bảng Xếp Hạng thành công.");
    }
}

public record GetRankingGovernanceConfigQuery() : IRequest<Result<RankingGovernanceConfigDto>>;

public class GetRankingGovernanceConfigQueryHandler : IRequestHandler<GetRankingGovernanceConfigQuery, Result<RankingGovernanceConfigDto>>
{
    private readonly IRankingRepository _rankingRepository;

    public GetRankingGovernanceConfigQueryHandler(IRankingRepository rankingRepository)
    {
        _rankingRepository = rankingRepository;
    }

    public async Task<Result<RankingGovernanceConfigDto>> Handle(GetRankingGovernanceConfigQuery request, CancellationToken ct)
    {
        var config = await _rankingRepository.GetGovernanceConfigAsync(ct);
        return Result<RankingGovernanceConfigDto>.Success(config);
    }
}

public record UpdateRankingGovernanceConfigCommand(RankingGovernanceConfigDto Config) : IRequest<Result<RankingGovernanceConfigDto>>;

public class UpdateRankingGovernanceConfigCommandHandler : IRequestHandler<UpdateRankingGovernanceConfigCommand, Result<RankingGovernanceConfigDto>>
{
    private readonly IRankingRepository _rankingRepository;
    private readonly ICacheService _cacheService;
    private readonly ICurrentUserService _currentUserService;

    public UpdateRankingGovernanceConfigCommandHandler(
        IRankingRepository rankingRepository,
        ICacheService cacheService,
        ICurrentUserService currentUserService)
    {
        _rankingRepository = rankingRepository;
        _cacheService = cacheService;
        _currentUserService = currentUserService;
    }

    public async Task<Result<RankingGovernanceConfigDto>> Handle(UpdateRankingGovernanceConfigCommand request, CancellationToken ct)
    {
        var adminId = _currentUserService.UserId ?? 1;
        var updated = await _rankingRepository.UpdateGovernanceConfigAsync(request.Config, adminId, ct);
        await _cacheService.RemoveByPatternAsync("rank:*", ct);
        return Result<RankingGovernanceConfigDto>.Success(updated, "Đã lưu cấu hình Bảng xếp hạng vào cơ sở dữ liệu và đồng bộ lại điểm số thành công.");
    }
}
