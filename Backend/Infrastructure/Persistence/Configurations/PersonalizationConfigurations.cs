namespace Infrastructure.Persistence.Configurations;

public class FavoriteConfiguration : IEntityTypeConfiguration<Favorite>
{
    public void Configure(EntityTypeBuilder<Favorite> builder)
    {
        builder.ToTable("Favorites", "dbo");

        builder.HasKey(e => new { e.UserId, e.TargetId, e.TargetType });

        builder.Property(e => e.TargetType)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.Favorites)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class VisitLogConfiguration : IEntityTypeConfiguration<VisitLog>
{
    public void Configure(EntityTypeBuilder<VisitLog> builder)
    {
        builder.ToTable("VisitLogs", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.VisitedDate)
            .HasColumnType("date");

        builder.Property(e => e.Privacy)
            .HasConversion<byte>()
            .HasDefaultValue(VisitPrivacy.Public);

        builder.Property(e => e.Note)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.VisitLogs)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Place)
            .WithMany(p => p.VisitLogs)
            .HasForeignKey(e => e.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AccessHistoryConfiguration : IEntityTypeConfiguration<AccessHistory>
{
    public void Configure(EntityTypeBuilder<AccessHistory> builder)
    {
        builder.ToTable("AccessHistories", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.UserId, e.ViewedAt }, "IX_AccessHistories_UserId_ViewedAt");

        builder.Property(e => e.ViewedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.AccessHistories)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Place)
            .WithMany(p => p.AccessHistories)
            .HasForeignKey(e => e.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt }, "IX_Notifications_UserId_IsRead");

        builder.HasIndex(e => new { e.UserId, e.ArchivedAt, e.CreatedAt }, "IX_Notifications_User_Active")
            .HasFilter("[ArchivedAt] IS NULL");

        builder.Property(e => e.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Content)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.Type)
            .HasConversion<byte>();

        builder.Property(e => e.Priority)
            .HasDefaultValue((byte)2);

        builder.Property(e => e.GroupKey)
            .HasMaxLength(150)
            .IsUnicode(false);

        builder.Property(e => e.DeduplicationKey)
            .HasMaxLength(200)
            .IsUnicode(false);

        builder.Property(e => e.EntityType)
            .HasMaxLength(50)
            .IsUnicode(false);

        builder.Property(e => e.TargetUrl)
            .HasMaxLength(500);

        builder.Property(e => e.IsRead)
            .HasDefaultValue(false);

        builder.Property(e => e.DataJSON)
            .HasColumnName("DataJSON");

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ActorUser)
            .WithMany()
            .HasForeignKey(e => e.ActorUserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
