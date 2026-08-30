namespace Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => e.Email, "UQ_Users_Email").IsUnique();

        builder.Property(e => e.Email)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(e => e.PasswordHash)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.Role)
            .HasConversion<byte>();

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(e => e.IsDeleted)
            .HasDefaultValue(false);

        // Relationships
        builder.HasOne(e => e.Profile)
            .WithOne(p => p.User)
            .HasForeignKey<UserProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("UserProfiles", "dbo");

        builder.HasKey(e => e.UserId);

        builder.Property(e => e.FullName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.Phone)
            .HasMaxLength(20);

        builder.Property(e => e.AvatarUrl)
            .HasMaxLength(500);

        builder.Property(e => e.CoverUrl)
            .HasMaxLength(500);

        builder.Property(e => e.Bio)
            .HasMaxLength(500);

        builder.Property(e => e.GoogleId)
            .HasMaxLength(100);

        builder.Property(e => e.ReputationScore)
            .HasDefaultValue(0);

        builder.Property(e => e.RankLevel)
            .HasMaxLength(50)
            .HasDefaultValue("Tân binh");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");
    }
}

public class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
{
    public void Configure(EntityTypeBuilder<Friendship> builder)
    {
        builder.ToTable("Friendships", "dbo");

        builder.HasKey(e => new { e.User1Id, e.User2Id });

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User1)
            .WithMany(u => u.FriendshipsInitiated)
            .HasForeignKey(e => e.User1Id)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.User2)
            .WithMany(u => u.FriendshipsReceived)
            .HasForeignKey(e => e.User2Id)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.ActionUser)
            .WithMany()
            .HasForeignKey(e => e.ActionUserId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
