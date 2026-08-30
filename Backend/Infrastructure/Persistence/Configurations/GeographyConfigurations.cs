namespace Infrastructure.Persistence.Configurations;

public class RegionConfiguration : IEntityTypeConfiguration<Region>
{
    public void Configure(EntityTypeBuilder<Region> builder)
    {
        builder.ToTable("Regions", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => e.Name, "UQ_Regions_Name").IsUnique();

        builder.Property(e => e.Name)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Tagline)
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(800);

        builder.Property(e => e.ImageUrl)
            .HasMaxLength(500);

        builder.Property(e => e.OrderIndex)
            .HasDefaultValue(0);

        builder.Property(e => e.Status)
            .HasConversion<byte>();
    }
}

public class ProvinceConfiguration : IEntityTypeConfiguration<Province>
{
    public void Configure(EntityTypeBuilder<Province> builder)
    {
        builder.ToTable("Provinces", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.Name, e.RegionId }, "UQ_Provinces_Name_RegionId").IsUnique();

        builder.Property(e => e.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.Tagline)
            .HasMaxLength(200);

        builder.Property(e => e.ImageUrl)
            .HasMaxLength(500);

        builder.Property(e => e.Featured)
            .HasDefaultValue(false);

        builder.Property(e => e.DisplayOrder)
            .HasDefaultValue(0);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.HasOne(e => e.Region)
            .WithMany(r => r.Provinces)
            .HasForeignKey(e => e.RegionId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
