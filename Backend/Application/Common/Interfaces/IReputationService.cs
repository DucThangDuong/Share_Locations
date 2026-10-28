using Application.Common;
using Application.DTOs;
using Domain.Enums;

namespace Application.Common.Interfaces;

public interface IReputationService
{
    Task<ReputationAwardResult> AwardPointsAsync(
        long userId,
        ReputationActionType actionType,
        long? entityId = null,
        string? description = null,
        CancellationToken ct = default);

    Task<bool> DeductPointsAsync(
        long userId,
        ReputationActionType actionType,
        int points,
        long? entityId = null,
        string? reason = null,
        CancellationToken ct = default);

    Task<PagedResult<ReputationLogDto>> GetUserHistoryAsync(
        long userId,
        int page,
        int pageSize,
        CancellationToken ct = default);
}
