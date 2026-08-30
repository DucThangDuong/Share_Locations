namespace Infrastructure.Persistence.Configurations;

public class PlaceConfiguration : IEntityTypeConfiguration<Place>
{
    public void Configure(EntityTypeBuilder<Place> builder)
    {
        builder.ToTable("Places", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.ProvinceId, e.CategoryId }, "IX_Places_Province_Category");

        builder.Property(e => e.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Address)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.Phone)
            .HasMaxLength(20);

        builder.Property(e => e.Website)
            .HasMaxLength(500);

        builder.Property(e => e.MinPrice)
            .HasColumnType("decimal(12, 0)");

        builder.Property(e => e.MaxPrice)
            .HasColumnType("decimal(12, 0)");

        builder.Property(e => e.OpeningHours)
            .HasMaxLength(255);

        builder.Property(e => e.Latitude)
            .HasColumnType("decimal(10, 7)");

        builder.Property(e => e.Longitude)
            .HasColumnType("decimal(10, 7)");

        builder.Property(e => e.AvgRating)
            .HasColumnType("decimal(3, 2)")
            .HasDefaultValue(0.0m);

        builder.Property(e => e.ReviewCount)
            .HasDefaultValue(0);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Province)
            .WithMany(p => p.Places)
            .HasForeignKey(e => e.ProvinceId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Category)
            .WithMany(c => c.Places)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.Creator)
            .WithMany(u => u.CreatedPlaces)
            .HasForeignKey(e => e.CreatedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class PlaceMediaConfiguration : IEntityTypeConfiguration<PlaceMedia>
{
    public void Configure(EntityTypeBuilder<PlaceMedia> builder)
    {
        builder.ToTable("PlaceMedia", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.MediaType)
            .HasConversion<byte>();

        builder.Property(e => e.Url)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.DisplayOrder)
            .HasDefaultValue(0);

        builder.Property(e => e.IsVerified)
            .HasDefaultValue(true);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Place)
            .WithMany(p => p.Media)
            .HasForeignKey(e => e.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Uploader)
            .WithMany()
            .HasForeignKey(e => e.UploadedBy)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class CollectionConfiguration : IEntityTypeConfiguration<Collection>
{
    public void Configure(EntityTypeBuilder<Collection> builder)
    {
        builder.ToTable("Collections", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Title)
            .HasMaxLength(250)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.IsFeatured)
            .HasDefaultValue(false);

        builder.Property(e => e.DisplayOrder)
            .HasDefaultValue(0);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");
    }
}

public class CollectionPlaceConfiguration : IEntityTypeConfiguration<CollectionPlace>
{
    public void Configure(EntityTypeBuilder<CollectionPlace> builder)
    {
        builder.ToTable("CollectionPlaces", "dbo");

        builder.HasKey(e => new { e.CollectionId, e.PlaceId });

        builder.Property(e => e.DisplayOrder)
            .HasDefaultValue(0);

        builder.HasOne(e => e.Collection)
            .WithMany(c => c.CollectionPlaces)
            .HasForeignKey(e => e.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Place)
            .WithMany(p => p.CollectionPlaces)
            .HasForeignKey(e => e.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
