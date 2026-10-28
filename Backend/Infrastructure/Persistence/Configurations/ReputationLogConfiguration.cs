using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ReputationLogConfiguration : IEntityTypeConfiguration<ReputationLog>
{
    public void Configure(EntityTypeBuilder<ReputationLog> builder)
    {
        builder.ToTable("ReputationLogs", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.ActionType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Points)
            .IsRequired();

        builder.Property(e => e.BalanceAfter)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasMaxLength(255);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.User)
            .WithMany(u => u.ReputationLogs)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
