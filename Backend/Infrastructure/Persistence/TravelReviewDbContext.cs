namespace Infrastructure.Persistence;

public class TravelReviewDbContext : DbContext
{
    public TravelReviewDbContext(DbContextOptions<TravelReviewDbContext> options)
        : base(options)
    {
    }

    // 1. Identity & RBAC
    public virtual DbSet<User> Users => Set<User>();
    public virtual DbSet<Role> Roles => Set<Role>();
    public virtual DbSet<Permission> Permissions => Set<Permission>();
    public virtual DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public virtual DbSet<UserRole> UserRoles => Set<UserRole>();
    public virtual DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public virtual DbSet<Friendship> Friendships => Set<Friendship>();

    // 2. Geography
    public virtual DbSet<Region> Regions => Set<Region>();
    public virtual DbSet<Province> Provinces => Set<Province>();

    // 3. Catalog
    public virtual DbSet<PlaceType> PlaceTypes => Set<PlaceType>();
    public virtual DbSet<Category> Categories => Set<Category>();

    // 4. Places
    public virtual DbSet<Place> Places => Set<Place>();
    public virtual DbSet<PlaceMedia> PlaceMedia => Set<PlaceMedia>();
    public virtual DbSet<Collection> Collections => Set<Collection>();
    public virtual DbSet<CollectionPlace> CollectionPlaces => Set<CollectionPlace>();

    // 5. Foods
    public virtual DbSet<Food> Foods => Set<Food>();
    public virtual DbSet<FoodMedia> FoodMedia => Set<FoodMedia>();
    public virtual DbSet<FoodPlace> FoodPlaces => Set<FoodPlace>();
    public virtual DbSet<FoodProvince> FoodProvinces => Set<FoodProvince>();

    // 6. Trips
    public virtual DbSet<Trip> Trips => Set<Trip>();
    public virtual DbSet<TripMember> TripMembers => Set<TripMember>();
    public virtual DbSet<TripDay> TripDays => Set<TripDay>();
    public virtual DbSet<TripPlace> TripPlaces => Set<TripPlace>();

    // 7. Reviews
    public virtual DbSet<Review> Reviews => Set<Review>();
    public virtual DbSet<ReviewMedia> ReviewMedia => Set<ReviewMedia>();
    public virtual DbSet<ReviewLike> ReviewLikes => Set<ReviewLike>();
    public virtual DbSet<Comment> Comments => Set<Comment>();

    // 8. Community
    public virtual DbSet<Proposal> Proposals => Set<Proposal>();
    public virtual DbSet<Blog> Blogs => Set<Blog>();

    // 9. Chat
    public virtual DbSet<ChatRoom> ChatRooms => Set<ChatRoom>();
    public virtual DbSet<ChatRoomMember> ChatRoomMembers => Set<ChatRoomMember>();
    public virtual DbSet<Message> Messages => Set<Message>();
    public virtual DbSet<MessageAttachment> MessageAttachments => Set<MessageAttachment>();
    public virtual DbSet<MessageReaction> MessageReactions => Set<MessageReaction>();

    // 10. Personalization
    public virtual DbSet<Favorite> Favorites => Set<Favorite>();
    public virtual DbSet<VisitLog> VisitLogs => Set<VisitLog>();
    public virtual DbSet<AccessHistory> AccessHistories => Set<AccessHistory>();
    public virtual DbSet<Notification> Notifications => Set<Notification>();

    // 11. Moderation
    public virtual DbSet<ReportType> ReportTypes => Set<ReportType>();
    public virtual DbSet<PlaceReport> PlaceReports => Set<PlaceReport>();
    public virtual DbSet<ReviewReport> ReviewReports => Set<ReviewReport>();
    public virtual DbSet<CommentReport> CommentReports => Set<CommentReport>();
    public virtual DbSet<BlogReport> BlogReports => Set<BlogReport>();

    // 12. Administration & Scopes
    public virtual DbSet<AdminRegionScope> AdminRegionScopes => Set<AdminRegionScope>();
    public virtual DbSet<AdminProvinceScope> AdminProvinceScopes => Set<AdminProvinceScope>();
    public virtual DbSet<AdminCategoryScope> AdminCategoryScopes => Set<AdminCategoryScope>();
    public virtual DbSet<AdminActionLog> AdminActionLogs => Set<AdminActionLog>();
    public virtual DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TravelReviewDbContext).Assembly);
    }
}
