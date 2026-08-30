namespace Domain.Interfaces;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByUserIdAsync(long userId, CancellationToken ct = default);
    Task AddAsync(UserProfile profile, CancellationToken ct = default);
    void Update(UserProfile profile);
    void Delete(UserProfile profile);
}
