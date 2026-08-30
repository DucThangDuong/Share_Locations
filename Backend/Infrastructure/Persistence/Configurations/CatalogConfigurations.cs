namespace Infrastructure.Persistence.Configurations;

public class PlaceTypeConfiguration : IEntityTypeConfiguration<PlaceType>
{
    public void Configure(EntityTypeBuilder<PlaceType> builder)
    {
        builder.ToTable("PlaceTypes", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Name)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.IconClass)
            .HasMaxLength(50);

        builder.Property(e => e.Status)
            .HasConversion<byte>();
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.IconClass)
            .HasMaxLength(50);

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.HasOne(e => e.PlaceType)
            .WithMany(pt => pt.Categories)
            .HasForeignKey(e => e.PlaceTypeId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
