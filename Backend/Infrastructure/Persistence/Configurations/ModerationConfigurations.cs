namespace Infrastructure.Persistence.Configurations;

public class ReportTypeConfiguration : IEntityTypeConfiguration<ReportType>
{
    public void Configure(EntityTypeBuilder<ReportType> builder)
    {
        builder.ToTable("ReportTypes", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Code)
            .HasMaxLength(50)
            .IsUnicode(false)
            .IsRequired();

        builder.HasIndex(e => e.Code, "UQ_ReportTypes_Code").IsUnique();

        builder.Property(e => e.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        builder.Property(e => e.DisplayOrder)
            .HasDefaultValue(0);

        builder.HasData(
            new { Id = 1, Code = "CLOSED", Name = "Địa điểm đã đóng cửa / Dừng hoạt động", IsActive = true, DisplayOrder = 1 },
            new { Id = 2, Code = "WRONG_INFO", Name = "Sai thông tin, sai địa chỉ hoặc vị trí", IsActive = true, DisplayOrder = 2 },
            new { Id = 3, Code = "WRONG_TIME_PRICE", Name = "Sai giờ mở cửa hoặc mức giá", IsActive = true, DisplayOrder = 3 },
            new { Id = 4, Code = "DUPLICATE", Name = "Nội dung / Địa điểm bị trùng lặp", IsActive = true, DisplayOrder = 4 },
            new { Id = 5, Code = "INAPPROPRIATE", Name = "Nội dung hoặc ảnh vi phạm / không chuẩn", IsActive = true, DisplayOrder = 5 },
            new { Id = 6, Code = "OTHER", Name = "Đề xuất cập nhật khác / Lý do khác", IsActive = true, DisplayOrder = 6 }
        );
    }
}

public class PlaceReportConfiguration : IEntityTypeConfiguration<PlaceReport>
{
    public void Configure(EntityTypeBuilder<PlaceReport> builder)
    {
        builder.ToTable("PlaceReports", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Reporter)
            .WithMany()
            .HasForeignKey(e => e.ReporterId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Place)
            .WithMany(p => p.Reports)
            .HasForeignKey(e => e.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ReportType)
            .WithMany(rt => rt.PlaceReports)
            .HasForeignKey(e => e.ReportTypeId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Resolver)
            .WithMany()
            .HasForeignKey(e => e.ResolvedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class ReviewReportConfiguration : IEntityTypeConfiguration<ReviewReport>
{
    public void Configure(EntityTypeBuilder<ReviewReport> builder)
    {
        builder.ToTable("ReviewReports", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Reporter)
            .WithMany()
            .HasForeignKey(e => e.ReporterId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Review)
            .WithMany(r => r.Reports)
            .HasForeignKey(e => e.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ReportType)
            .WithMany(rt => rt.ReviewReports)
            .HasForeignKey(e => e.ReportTypeId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Resolver)
            .WithMany()
            .HasForeignKey(e => e.ResolvedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class CommentReportConfiguration : IEntityTypeConfiguration<CommentReport>
{
    public void Configure(EntityTypeBuilder<CommentReport> builder)
    {
        builder.ToTable("CommentReports", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Reporter)
            .WithMany()
            .HasForeignKey(e => e.ReporterId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Comment)
            .WithMany(c => c.Reports)
            .HasForeignKey(e => e.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ReportType)
            .WithMany(rt => rt.CommentReports)
            .HasForeignKey(e => e.ReportTypeId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Resolver)
            .WithMany()
            .HasForeignKey(e => e.ResolvedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class BlogReportConfiguration : IEntityTypeConfiguration<BlogReport>
{
    public void Configure(EntityTypeBuilder<BlogReport> builder)
    {
        builder.ToTable("BlogReports", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Reporter)
            .WithMany()
            .HasForeignKey(e => e.ReporterId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Blog)
            .WithMany(b => b.Reports)
            .HasForeignKey(e => e.BlogId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ReportType)
            .WithMany(rt => rt.BlogReports)
            .HasForeignKey(e => e.ReportTypeId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Resolver)
            .WithMany()
            .HasForeignKey(e => e.ResolvedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
