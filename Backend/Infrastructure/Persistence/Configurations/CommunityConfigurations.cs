namespace Infrastructure.Persistence.Configurations;

public class ProposalConfiguration : IEntityTypeConfiguration<Proposal>
{
    public void Configure(EntityTypeBuilder<Proposal> builder)
    {
        builder.ToTable("Proposals", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.Status, e.CategoryId }, "IX_Proposals_Status_Category")
            .HasFilter("[Status] = 0");

        builder.Property(e => e.ProposalType)
            .HasConversion<byte>()
            .HasDefaultValue(ProposalType.NewPlace);

        builder.Property(e => e.ProposedDataJSON)
            .HasColumnName("ProposedDataJSON")
            .IsRequired();

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.AdminNote)
            .HasMaxLength(500);

        builder.Property(e => e.RejectReason)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.Proposals)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.TargetPlace)
            .WithMany(p => p.Proposals)
            .HasForeignKey(e => e.TargetPlaceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Category)
            .WithMany(c => c.Proposals)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Province)
            .WithMany(p => p.Proposals)
            .HasForeignKey(e => e.ProvinceId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.ReviewerAdmin)
            .WithMany()
            .HasForeignKey(e => e.ReviewedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class BlogConfiguration : IEntityTypeConfiguration<Blog>
{
    public void Configure(EntityTypeBuilder<Blog> builder)
    {
        builder.ToTable("Blogs", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.CategoryId, e.Status }, "IX_Blogs_CategoryId_Status");

        builder.Property(e => e.Title)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.Slug)
            .HasMaxLength(255)
            .IsUnicode(false);

        builder.Property(e => e.Excerpt)
            .HasMaxLength(500);

        builder.Property(e => e.ContentJSON)
            .HasColumnName("ContentJSON")
            .IsRequired();

        builder.Property(e => e.CoverImageUrl)
            .HasMaxLength(500);

        builder.Property(e => e.ReadTimeMinutes)
            .HasDefaultValue(5);

        builder.Property(e => e.ViewCount)
            .HasDefaultValue(0);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.HiddenReason)
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Author)
            .WithMany(u => u.Blogs)
            .HasForeignKey(e => e.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Category)
            .WithMany(c => c.Blogs)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.HiddenByUser)
            .WithMany()
            .HasForeignKey(e => e.HiddenBy)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.ReviewerAdmin)
            .WithMany()
            .HasForeignKey(e => e.ReviewedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
