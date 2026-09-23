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

        builder.Property(e => e.TargetScope)
            .HasMaxLength(50)
            .IsUnicode(false)
            .HasDefaultValue("ALL");

        builder.Property(e => e.IsActive)
            .HasDefaultValue(true);

        builder.Property(e => e.DisplayOrder)
            .HasDefaultValue(0);

        builder.HasData(
            new { Id = 1, Code = "PLACE_CLOSED", Name = "Địa điểm đã đóng cửa vĩnh viễn / Tạm dừng hoạt động", TargetScope = "PLACE", IsActive = true, DisplayOrder = 1 },
            new { Id = 2, Code = "PLACE_WRONG_INFO", Name = "Sai địa chỉ, vị trí trên bản đồ hoặc số điện thoại", TargetScope = "PLACE", IsActive = true, DisplayOrder = 2 },
            new { Id = 3, Code = "PLACE_WRONG_PRICE", Name = "Sai khung giờ mở cửa hoặc mức giá ước tính", TargetScope = "PLACE", IsActive = true, DisplayOrder = 3 },
            new { Id = 4, Code = "PLACE_DUPLICATE", Name = "Địa điểm bị tạo trùng lặp", TargetScope = "PLACE", IsActive = true, DisplayOrder = 4 },
            new { Id = 5, Code = "CONTENT_SPAM", Name = "Spam quảng cáo, chèo kéo hoặc nội dung vô nghĩa", TargetScope = "CONTENT", IsActive = true, DisplayOrder = 5 },
            new { Id = 6, Code = "CONTENT_OFFENSIVE", Name = "Ngôn từ thô tục, xúc phạm, đả kích hoặc thù ghét", TargetScope = "CONTENT", IsActive = true, DisplayOrder = 6 },
            new { Id = 7, Code = "CONTENT_FAKE", Name = "Đánh giá gian lận, dìm hàng đối thủ hoặc đánh giá ảo", TargetScope = "CONTENT", IsActive = true, DisplayOrder = 7 },
            new { Id = 8, Code = "CONTENT_NSFW_MEDIA", Name = "Hình ảnh nhạy cảm, bạo lực hoặc vi phạm thuần phong mỹ tục", TargetScope = "CONTENT", IsActive = true, DisplayOrder = 8 },
            new { Id = 9, Code = "CONTENT_COPYRIGHT", Name = "Vi phạm bản quyền hình ảnh hoặc đạo nhái bài viết", TargetScope = "CONTENT", IsActive = true, DisplayOrder = 9 },
            new { Id = 10, Code = "OTHER", Name = "Lý do khác / Đề xuất cập nhật khác", TargetScope = "ALL", IsActive = true, DisplayOrder = 10 }
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

        builder.HasIndex(e => new { e.ReporterId, e.PlaceId }, "UQ_PlaceReports_Pending")
            .IsUnique()
            .HasFilter("[Status] = 0");

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.AdminNote)
            .HasMaxLength(500);

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

        builder.HasIndex(e => new { e.ReporterId, e.ReviewId }, "UQ_ReviewReports_Pending")
            .IsUnique()
            .HasFilter("[Status] = 0");

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.AdminNote)
            .HasMaxLength(500);

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

        builder.HasIndex(e => new { e.ReporterId, e.CommentId }, "UQ_CommentReports_Pending")
            .IsUnique()
            .HasFilter("[Status] = 0");

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.AdminNote)
            .HasMaxLength(500);

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

        builder.HasIndex(e => new { e.ReporterId, e.BlogId }, "UQ_BlogReports_Pending")
            .IsUnique()
            .HasFilter("[Status] = 0");

        builder.Property(e => e.Reason)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.AdminNote)
            .HasMaxLength(500);

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
