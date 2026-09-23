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

        builder.Property(e => e.Role)
            .HasConversion<byte>()
            .HasDefaultValue(ChatMemberRole.Member);

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

        builder.Property(e => e.IsDeleted)
            .HasDefaultValue(false);

        builder.HasQueryFilter(e => !e.IsDeleted);

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

        builder.HasOne(e => e.ReplyToMessage)
            .WithMany()
            .HasForeignKey(e => e.ReplyToMessageId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}

public class MessageAttachmentConfiguration : IEntityTypeConfiguration<MessageAttachment>
{
    public void Configure(EntityTypeBuilder<MessageAttachment> builder)
    {
        builder.ToTable("MessageAttachments", "dbo");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.HasIndex(e => e.MessageId, "IX_MessageAttachments_MessageId");

        builder.Property(e => e.AttachmentType)
            .HasConversion<byte>()
            .IsRequired();

        builder.Property(e => e.MediaUrl)
            .HasMaxLength(500);

        builder.Property(e => e.FileName)
            .HasMaxLength(255);

        builder.Property(e => e.DisplayOrder)
            .HasDefaultValue(0);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Message)
            .WithMany(m => m.Attachments)
            .HasForeignKey(e => e.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Place)
            .WithMany()
            .HasForeignKey(e => e.PlaceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Food)
            .WithMany()
            .HasForeignKey(e => e.FoodId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Trip)
            .WithMany()
            .HasForeignKey(e => e.TripId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class MessageReactionConfiguration : IEntityTypeConfiguration<MessageReaction>
{
    public void Configure(EntityTypeBuilder<MessageReaction> builder)
    {
        builder.ToTable("MessageReactions", "dbo");

        builder.HasKey(e => new { e.MessageId, e.UserId });

        builder.HasIndex(e => e.MessageId, "IX_MessageReactions_MessageId");

        builder.Property(e => e.Emoji)
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        builder.HasOne(e => e.Message)
            .WithMany(m => m.Reactions)
            .HasForeignKey(e => e.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany(u => u.MessageReactions)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.ClientSetNull);
    }
}
