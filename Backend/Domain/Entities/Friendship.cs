using Domain.Enums;

namespace Domain.Entities;

public class Friendship
{
    public long User1Id { get; private set; }
    public long User2Id { get; private set; }
    public FriendshipStatus Status { get; private set; } = FriendshipStatus.Pending;
    public long ActionUserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public virtual User User1 { get; private set; } = null!;
    public virtual User User2 { get; private set; } = null!;
    public virtual User ActionUser { get; private set; } = null!;

    protected Friendship() { }

    public Friendship(long user1Id, long user2Id, long actionUserId, FriendshipStatus status = FriendshipStatus.Pending)
    {
        if (user1Id == user2Id)
            throw new ArgumentException("Không thể thiết lập quan hệ bạn bè với chính mình.");

        // Chuẩn hóa User1Id < User2Id để tránh đảo thứ tự gây trùng lặp composite key
        if (user1Id < user2Id)
        {
            User1Id = user1Id;
            User2Id = user2Id;
        }
        else
        {
            User1Id = user2Id;
            User2Id = user1Id;
        }

        ActionUserId = actionUserId;
        Status = status;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Accept(long actionUserId)
    {
        Status = FriendshipStatus.Accepted;
        ActionUserId = actionUserId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Block(long actionUserId)
    {
        Status = FriendshipStatus.Blocked;
        ActionUserId = actionUserId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ReRequest(long actionUserId)
    {
        Status = FriendshipStatus.Pending;
        ActionUserId = actionUserId;
        UpdatedAt = DateTime.UtcNow;
    }
}
