using Domain.Entities;

namespace Domain.Interfaces;

public interface IFriendshipRepository
{
    Task<Friendship?> GetFriendshipAsync(long user1Id, long user2Id, CancellationToken ct = default);
    Task AddAsync(Friendship friendship, CancellationToken ct = default);
    void Remove(Friendship friendship);
    Task<List<Friendship>> GetUserFriendshipsAsync(long userId, CancellationToken ct = default);
}
