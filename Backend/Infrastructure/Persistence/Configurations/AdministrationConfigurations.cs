namespace Infrastructure.Persistence.Configurations;

public class AdminRegionScopeConfiguration : IEntityTypeConfiguration<AdminRegionScope>
{
    public void Configure(EntityTypeBuilder<AdminRegionScope> builder)
    {
        builder.ToTable("AdminRegionScopes", "dbo");

        builder.HasKey(e => new { e.UserId, e.RegionId });

        builder.HasIndex(e => new { e.RegionId, e.UserId }, "IX_AdminRegionScopes_Region_User");

        builder.Property(e => e.AssignedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.AdminRegionScopes)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Region)
            .WithMany(r => r.AdminScopes)
            .HasForeignKey(e => e.RegionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.AssignedByUser)
            .WithMany()
            .HasForeignKey(e => e.AssignedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class AdminProvinceScopeConfiguration : IEntityTypeConfiguration<AdminProvinceScope>
{
    public void Configure(EntityTypeBuilder<AdminProvinceScope> builder)
    {
        builder.ToTable("AdminProvinceScopes", "dbo");

        builder.HasKey(e => new { e.UserId, e.ProvinceId });

        builder.HasIndex(e => new { e.ProvinceId, e.UserId }, "IX_AdminProvinceScopes_Province_User");

        builder.Property(e => e.AssignedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.AdminProvinceScopes)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Province)
            .WithMany(p => p.AdminScopes)
            .HasForeignKey(e => e.ProvinceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.AssignedByUser)
            .WithMany()
            .HasForeignKey(e => e.AssignedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class AdminCategoryScopeConfiguration : IEntityTypeConfiguration<AdminCategoryScope>
{
    public void Configure(EntityTypeBuilder<AdminCategoryScope> builder)
    {
        builder.ToTable("AdminCategoryScopes", "dbo");

        builder.HasKey(e => new { e.UserId, e.CategoryId });

        builder.HasIndex(e => new { e.CategoryId, e.UserId }, "IX_AdminCategoryScopes_Category_User");

        builder.Property(e => e.AssignedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.AdminCategoryScopes)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Category)
            .WithMany(c => c.AdminScopes)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.AssignedByUser)
            .WithMany()
            .HasForeignKey(e => e.AssignedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class AdminActionLogConfiguration : IEntityTypeConfiguration<AdminActionLog>
{
    public void Configure(EntityTypeBuilder<AdminActionLog> builder)
    {
        builder.ToTable("AdminActionLogs", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.TargetTable, e.TargetId }, "IX_AdminActionLogs_Target");
        builder.HasIndex(e => new { e.AdminId, e.CreatedAt }, "IX_AdminActionLogs_Admin_CreatedAt");

        builder.Property(e => e.ActorRoleCode)
            .HasMaxLength(50)
            .IsUnicode(false);

        builder.Property(e => e.ActionType)
            .HasMaxLength(50)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.TargetTable)
            .HasMaxLength(50)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.ActionStatus)
            .HasDefaultValue((byte)1);

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.RequestId)
            .HasMaxLength(100)
            .IsUnicode(false);

        builder.Property(e => e.CorrelationId)
            .HasMaxLength(100)
            .IsUnicode(false);

        builder.Property(e => e.IpAddress)
            .HasMaxLength(45)
            .IsUnicode(false);

        builder.Property(e => e.UserAgent)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Admin)
            .WithMany(u => u.AdminActionLogs)
            .HasForeignKey(e => e.AdminId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("SystemSettings", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => e.SettingKey, "UQ_SystemSettings_Key").IsUnique();

        builder.Property(e => e.SettingKey)
            .HasMaxLength(100)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(e => e.SettingValue)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(255);

        builder.Property(e => e.SettingGroup)
            .HasMaxLength(50)
            .IsUnicode(false)
            .HasDefaultValue("GENERAL");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.UpdatedByUser)
            .WithMany()
            .HasForeignKey(e => e.UpdatedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
