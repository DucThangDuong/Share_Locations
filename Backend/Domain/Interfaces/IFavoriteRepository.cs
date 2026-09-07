using Domain.Entities;
using Domain.Enums;

namespace Domain.Interfaces;

public interface IFavoriteRepository
{
    Task<Favorite?> GetAsync(long userId, long targetId, FavoriteTargetType targetType, CancellationToken ct = default);
    Task<bool> ExistsAsync(long userId, long targetId, FavoriteTargetType targetType, CancellationToken ct = default);
    Task AddAsync(Favorite favorite, CancellationToken ct = default);
    void Remove(Favorite favorite);
}
