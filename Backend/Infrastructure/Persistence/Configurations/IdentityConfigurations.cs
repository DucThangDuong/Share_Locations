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

        builder.Ignore(e => e.Role);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.LastLoginAt);

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

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => e.Code, "UQ_Roles_Code").IsUnique();

        builder.Property(e => e.Code)
            .HasMaxLength(50)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(255);

        builder.Property(e => e.IsSystemRole)
            .HasDefaultValue(false);

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);
    }
}

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => e.Code, "UQ_Permissions_Code").IsUnique();

        builder.Property(e => e.Code)
            .HasMaxLength(100)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(255);
    }
}

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("RolePermissions", "dbo");

        builder.HasKey(e => new { e.RoleId, e.PermissionId });

        builder.HasOne(e => e.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(e => e.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(e => e.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable("UserRoles", "dbo");

        builder.HasKey(e => new { e.UserId, e.RoleId });

        builder.HasIndex(e => new { e.RoleId, e.UserId }, "IX_UserRoles_Role_User");

        builder.Property(e => e.AssignedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(e => e.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.AssignedByUser)
            .WithMany()
            .HasForeignKey(e => e.AssignedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
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
