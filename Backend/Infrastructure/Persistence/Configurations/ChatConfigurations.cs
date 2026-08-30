namespace Infrastructure.Persistence.Configurations;

public class ChatRoomConfiguration : IEntityTypeConfiguration<ChatRoom>
{
    public void Configure(EntityTypeBuilder<ChatRoom> builder)
    {
        builder.ToTable("ChatRooms", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Name)
            .HasMaxLength(100);

        builder.Property(e => e.IsGroup)
            .HasDefaultValue(false);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");
    }
}

public class ChatRoomMemberConfiguration : IEntityTypeConfiguration<ChatRoomMember>
{
    public void Configure(EntityTypeBuilder<ChatRoomMember> builder)
    {
        builder.ToTable("ChatRoomMembers", "dbo");

        builder.HasKey(e => new { e.ChatRoomId, e.UserId });

        builder.HasIndex(e => e.UserId, "IX_ChatRoomMembers_UserId");

        builder.Property(e => e.JoinedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.ChatRoom)
            .WithMany(cr => cr.Members)
            .HasForeignKey(e => e.ChatRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany(u => u.ChatRoomMembers)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.ChatRoomId, e.CreatedAt }, "IX_Messages_ChatRoomId_CreatedAt");

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.ChatRoom)
            .WithMany(cr => cr.Messages)
            .HasForeignKey(e => e.ChatRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Sender)
            .WithMany(u => u.Messages)
            .HasForeignKey(e => e.SenderId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.AttachedPlace)
            .WithMany(p => p.Messages)
            .HasForeignKey(e => e.AttachedPlaceId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.AttachedFood)
            .WithMany(f => f.Messages)
            .HasForeignKey(e => e.AttachedFoodId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        builder.HasOne(e => e.AttachedTrip)
            .WithMany(t => t.Messages)
            .HasForeignKey(e => e.AttachedTripId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
