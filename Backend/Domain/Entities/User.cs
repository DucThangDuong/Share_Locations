using Domain.Enums;

namespace Domain.Entities;

public class User
{
    public long Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; } = UserRole.User;
    public UserStatus Status { get; private set; } = UserStatus.Active;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public bool IsDeleted { get; private set; }

    // Navigation properties
    public virtual UserProfile? Profile { get; private set; }

    private readonly List<Friendship> _friendshipsInitiated = new();
    public virtual IReadOnlyCollection<Friendship> FriendshipsInitiated => _friendshipsInitiated.AsReadOnly();

    private readonly List<Friendship> _friendshipsReceived = new();
    public virtual IReadOnlyCollection<Friendship> FriendshipsReceived => _friendshipsReceived.AsReadOnly();

    private readonly List<Place> _createdPlaces = new();
    public virtual IReadOnlyCollection<Place> CreatedPlaces => _createdPlaces.AsReadOnly();

    private readonly List<Trip> _trips = new();
    public virtual IReadOnlyCollection<Trip> Trips => _trips.AsReadOnly();

    private readonly List<Review> _reviews = new();
    public virtual IReadOnlyCollection<Review> Reviews => _reviews.AsReadOnly();

    private readonly List<Comment> _comments = new();
    public virtual IReadOnlyCollection<Comment> Comments => _comments.AsReadOnly();

    private readonly List<Proposal> _proposals = new();
    public virtual IReadOnlyCollection<Proposal> Proposals => _proposals.AsReadOnly();

    private readonly List<Blog> _blogs = new();
    public virtual IReadOnlyCollection<Blog> Blogs => _blogs.AsReadOnly();

    private readonly List<ChatRoomMember> _chatRoomMembers = new();
    public virtual IReadOnlyCollection<ChatRoomMember> ChatRoomMembers => _chatRoomMembers.AsReadOnly();

    private readonly List<Message> _messages = new();
    public virtual IReadOnlyCollection<Message> Messages => _messages.AsReadOnly();

    private readonly List<Favorite> _favorites = new();
    public virtual IReadOnlyCollection<Favorite> Favorites => _favorites.AsReadOnly();

    private readonly List<VisitLog> _visitLogs = new();
    public virtual IReadOnlyCollection<VisitLog> VisitLogs => _visitLogs.AsReadOnly();

    private readonly List<AccessHistory> _accessHistories = new();
    public virtual IReadOnlyCollection<AccessHistory> AccessHistories => _accessHistories.AsReadOnly();

    private readonly List<Notification> _notifications = new();
    public virtual IReadOnlyCollection<Notification> Notifications => _notifications.AsReadOnly();
}
