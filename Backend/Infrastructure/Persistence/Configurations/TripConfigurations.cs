namespace Infrastructure.Persistence.Configurations;

public class TripConfiguration : IEntityTypeConfiguration<Trip>
{
    public void Configure(EntityTypeBuilder<Trip> builder)
    {
        builder.ToTable("Trips", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.Property(e => e.CoverImageUrl)
            .HasMaxLength(500);

        builder.Property(e => e.Privacy)
            .HasConversion<byte>();

        builder.Property(e => e.Status)
            .HasConversion<byte>();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.Trips)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TripDayConfiguration : IEntityTypeConfiguration<TripDay>
{
    public void Configure(EntityTypeBuilder<TripDay> builder)
    {
        builder.ToTable("TripDays", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.DayTitle)
            .HasMaxLength(150);

        builder.HasOne(e => e.Trip)
            .WithMany(t => t.Days)
            .HasForeignKey(e => e.TripId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TripPlaceConfiguration : IEntityTypeConfiguration<TripPlace>
{
    public void Configure(EntityTypeBuilder<TripPlace> builder)
    {
        builder.ToTable("TripPlaces", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.VisitOrder)
            .HasDefaultValue(0);

        builder.Property(e => e.Note)
            .HasMaxLength(500);

        builder.HasOne(e => e.TripDay)
            .WithMany(td => td.Places)
            .HasForeignKey(e => e.TripDayId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Place)
            .WithMany(p => p.TripPlaces)
            .HasForeignKey(e => e.PlaceId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
