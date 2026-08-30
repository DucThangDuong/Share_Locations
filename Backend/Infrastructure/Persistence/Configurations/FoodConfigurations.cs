namespace Infrastructure.Persistence.Configurations;

public class FoodConfiguration : IEntityTypeConfiguration<Food>
{
    public void Configure(EntityTypeBuilder<Food> builder)
    {
        builder.ToTable("Foods", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => e.Name, "UQ_Foods_Name").IsUnique();

        builder.Property(e => e.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(e => e.CoverImageUrl)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");
    }
}

public class FoodMediaConfiguration : IEntityTypeConfiguration<FoodMedia>
{
    public void Configure(EntityTypeBuilder<FoodMedia> builder)
    {
        builder.ToTable("FoodMedia", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.MediaType)
            .HasConversion<byte>();

        builder.Property(e => e.Url)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(e => e.Title)
            .HasMaxLength(150);

        builder.Property(e => e.DisplayOrder)
            .HasDefaultValue(0);

        builder.HasOne(e => e.Food)
            .WithMany(f => f.Media)
            .HasForeignKey(e => e.FoodId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FoodPlaceConfiguration : IEntityTypeConfiguration<FoodPlace>
{
    public void Configure(EntityTypeBuilder<FoodPlace> builder)
    {
        builder.ToTable("FoodPlaces", "dbo");

        builder.HasKey(e => new { e.FoodId, e.PlaceId });

        builder.HasOne(e => e.Food)
            .WithMany(f => f.FoodPlaces)
            .HasForeignKey(e => e.FoodId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Place)
            .WithMany(p => p.FoodPlaces)
            .HasForeignKey(e => e.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FoodProvinceConfiguration : IEntityTypeConfiguration<FoodProvince>
{
    public void Configure(EntityTypeBuilder<FoodProvince> builder)
    {
        builder.ToTable("FoodProvinces", "dbo");

        builder.HasKey(e => new { e.FoodId, e.ProvinceId });

        builder.HasOne(e => e.Food)
            .WithMany(f => f.FoodProvinces)
            .HasForeignKey(e => e.FoodId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Province)
            .WithMany(p => p.FoodProvinces)
            .HasForeignKey(e => e.ProvinceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
