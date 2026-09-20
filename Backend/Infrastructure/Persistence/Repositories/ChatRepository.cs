using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Dapper;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public ChatRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<InboxItemDto>> GetInboxAsync(long currentUserId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string sql = @"
            SELECT 
                cr.Id AS RoomId,
                cr.IsGroup,
                CASE 
                    WHEN cr.IsGroup = 1 THEN cr.Name
                    ELSE COALESCE(otherProf.FullName, otherU.Email, N'Người dùng')
                END AS Name,
                CASE 
                    WHEN cr.IsGroup = 1 THEN NULL
                    ELSE otherProf.AvatarUrl
                END AS AvatarUrl,
                CASE 
                    WHEN cr.IsGroup = 1 THEN NULL
                    ELSE otherM.UserId
                END AS OtherUserId,
                COALESCE(
                    lastMsg.Content,
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM dbo.MessageAttachments ma WHERE ma.MessageId = lastMsg.Id AND ma.AttachmentType = 1) THEN N'[Địa điểm]'
                        WHEN EXISTS (SELECT 1 FROM dbo.MessageAttachments ma WHERE ma.MessageId = lastMsg.Id AND ma.AttachmentType = 2) THEN N'[Món ăn]'
                        WHEN EXISTS (SELECT 1 FROM dbo.MessageAttachments ma WHERE ma.MessageId = lastMsg.Id AND ma.AttachmentType = 3) THEN N'[Lịch trình]'
                        WHEN EXISTS (SELECT 1 FROM dbo.MessageAttachments ma WHERE ma.MessageId = lastMsg.Id AND ma.AttachmentType = 4) THEN N'[Hình ảnh]'
                        WHEN EXISTS (SELECT 1 FROM dbo.MessageAttachments ma WHERE ma.MessageId = lastMsg.Id) THEN N'[Tệp đính kèm]'
                        ELSE N''
                    END
                ) AS LastMessage,
                lastMsg.CreatedAt AS LastMessageAt,
                (
                    SELECT COUNT(1) 
                    FROM dbo.Messages unreadM 
                    WHERE unreadM.ChatRoomId = cr.Id 
                      AND (myM.LastReadAt IS NULL OR unreadM.CreatedAt > myM.LastReadAt)
                ) AS UnreadCount
            FROM dbo.ChatRoomMembers myM
            INNER JOIN dbo.ChatRooms cr ON myM.ChatRoomId = cr.Id
            OUTER APPLY (
                SELECT TOP 1 m2.UserId 
                FROM dbo.ChatRoomMembers m2 
                WHERE m2.ChatRoomId = cr.Id AND m2.UserId <> @CurrentUserId
            ) otherM
            LEFT JOIN dbo.Users otherU ON otherM.UserId = otherU.Id
            LEFT JOIN dbo.UserProfiles otherProf ON otherU.Id = otherProf.UserId
            OUTER APPLY (
                SELECT TOP 1 lm.Id, lm.Content, lm.CreatedAt
                FROM dbo.Messages lm
                WHERE lm.ChatRoomId = cr.Id
                ORDER BY lm.CreatedAt DESC
            ) lastMsg
            WHERE myM.UserId = @CurrentUserId
            ORDER BY COALESCE(lastMsg.CreatedAt, cr.CreatedAt) DESC;";

        var rows = await connection.QueryAsync<InboxItemDto>(sql, new { CurrentUserId = currentUserId });
        return rows.ToList();
    }

    public async Task<long> GetOrCreateDirectRoomAsync(long userAId, long userBId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string findRoomSql = @"
            SELECT TOP 1 cr.Id
            FROM dbo.ChatRooms cr
            INNER JOIN dbo.ChatRoomMembers m1 ON cr.Id = m1.ChatRoomId AND m1.UserId = @UserAId
            INNER JOIN dbo.ChatRoomMembers m2 ON cr.Id = m2.ChatRoomId AND m2.UserId = @UserBId
            WHERE cr.IsGroup = 0;";

        var existingRoomId = await connection.QueryFirstOrDefaultAsync<long?>(
            findRoomSql,
            new { UserAId = userAId, UserBId = userBId });

        if (existingRoomId.HasValue && existingRoomId.Value > 0)
        {
            return existingRoomId.Value;
        }

        // Tạo phòng mới qua EF Core
        var newRoom = new ChatRoom(name: null, isGroup: false);
        _dbContext.ChatRooms.Add(newRoom);
        await _dbContext.SaveChangesAsync(ct);

        var memberA = new ChatRoomMember(newRoom.Id, userAId);
        var memberB = new ChatRoomMember(newRoom.Id, userBId);
        _dbContext.ChatRoomMembers.AddRange(memberA, memberB);
        await _dbContext.SaveChangesAsync(ct);

        return newRoom.Id;
    }

    public async Task<bool> IsUserInRoomAsync(long roomId, long userId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            SELECT COUNT(1) 
            FROM dbo.ChatRoomMembers 
            WHERE ChatRoomId = @RoomId AND UserId = @UserId;";

        var count = await connection.ExecuteScalarAsync<int>(sql, new { RoomId = roomId, UserId = userId });
        return count > 0;
    }

    public async Task<IReadOnlyList<ChatMessageDto>> GetRoomMessagesAsync(
        long roomId,
        long currentUserId,
        int page = 1,
        int limit = 20,
        CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var offset = (page - 1) * limit;

        const string messagesSql = @"
            SELECT 
                m.Id,
                m.ChatRoomId AS RoomId,
                m.SenderId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS SenderName,
                prof.AvatarUrl AS SenderAvatarUrl,
                m.Content,
                m.ReplyToMessageId,
                m.CreatedAt,
                replyM.Content AS ReplyToMessageSnippet,
                COALESCE(replyProf.FullName, replyU.Email) AS ReplyToSenderName
            FROM dbo.Messages m
            INNER JOIN dbo.Users u ON m.SenderId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Messages replyM ON m.ReplyToMessageId = replyM.Id
            LEFT JOIN dbo.Users replyU ON replyM.SenderId = replyU.Id
            LEFT JOIN dbo.UserProfiles replyProf ON replyU.Id = replyProf.UserId
            WHERE m.ChatRoomId = @RoomId
            ORDER BY m.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;";

        var messages = (await connection.QueryAsync<ChatMessageDto>(messagesSql, new
        {
            RoomId = roomId,
            Offset = offset,
            Limit = limit
        })).ToList();

        if (messages.Count == 0)
        {
            return messages;
        }

        var messageIds = messages.Select(m => m.Id).ToList();

        // 1. Lấy Attachments
        const string attachmentsSql = @"
            SELECT 
                ma.Id,
                ma.MessageId,
                ma.AttachmentType,
                ma.MediaUrl,
                ma.FileName,
                ma.FileSizeBytes,
                ma.DurationSeconds,
                ma.DisplayOrder,
                ma.PlaceId,
                p.Name AS PlaceName,
                p.CoverImageUrl AS PlaceCoverUrl,
                ma.FoodId,
                f.Name AS FoodName,
                f.CoverImageUrl AS FoodCoverUrl,
                ma.TripId,
                t.Title AS TripTitle,
                t.CoverImageUrl AS TripCoverUrl
            FROM dbo.MessageAttachments ma
            LEFT JOIN dbo.Places p ON ma.PlaceId = p.Id
            LEFT JOIN dbo.Foods f ON ma.FoodId = f.Id
            LEFT JOIN dbo.Trips t ON ma.TripId = t.Id
            WHERE ma.MessageId IN @MessageIds
            ORDER BY ma.DisplayOrder, ma.Id;";

        var attachmentRows = (await connection.QueryAsync(attachmentsSql, new { MessageIds = messageIds })).ToList();
        var attachmentsByMsg = attachmentRows.ToLookup(r => (long)r.MessageId);

        // 2. Lấy Reactions
        const string reactionsSql = @"
            SELECT 
                mr.MessageId,
                mr.UserId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS UserName,
                mr.Emoji,
                mr.CreatedAt
            FROM dbo.MessageReactions mr
            INNER JOIN dbo.Users u ON mr.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            WHERE mr.MessageId IN @MessageIds
            ORDER BY mr.CreatedAt;";

        var reactionRows = (await connection.QueryAsync<MessageReactionDto>(reactionsSql, new { MessageIds = messageIds })).ToList();
        var reactionsByMsg = reactionRows.ToLookup(r => r.MessageId);

        foreach (var msg in messages)
        {
            if (attachmentsByMsg.Contains(msg.Id))
            {
                msg.Attachments = attachmentsByMsg[msg.Id].Select(a => new MessageAttachmentDto
                {
                    Id = (long)a.Id,
                    AttachmentType = (MessageAttachmentType)(byte)a.AttachmentType,
                    MediaUrl = (string?)a.MediaUrl,
                    FileName = (string?)a.FileName,
                    FileSizeBytes = a.FileSizeBytes != null ? (long)a.FileSizeBytes : null,
                    DurationSeconds = a.DurationSeconds != null ? (int)a.DurationSeconds : null,
                    DisplayOrder = (int)a.DisplayOrder,
                    PlaceId = a.PlaceId != null ? (long)a.PlaceId : null,
                    PlaceName = (string?)a.PlaceName,
                    PlaceCoverUrl = (string?)a.PlaceCoverUrl,
                    FoodId = a.FoodId != null ? (long)a.FoodId : null,
                    FoodName = (string?)a.FoodName,
                    FoodCoverUrl = (string?)a.FoodCoverUrl,
                    TripId = a.TripId != null ? (long)a.TripId : null,
                    TripTitle = (string?)a.TripTitle,
                    TripCoverUrl = (string?)a.TripCoverUrl
                }).ToList();
            }

            if (reactionsByMsg.Contains(msg.Id))
            {
                msg.Reactions = reactionsByMsg[msg.Id].ToList();
            }
        }

        // Đảo lại thứ tự thời gian tăng dần để client hiển thị từ trên xuống dưới
        messages.Reverse();
        return messages;
    }

    public async Task<ChatMessageDto?> GetMessageByIdAsync(long messageId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string messageSql = @"
            SELECT 
                m.Id,
                m.ChatRoomId AS RoomId,
                m.SenderId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS SenderName,
                prof.AvatarUrl AS SenderAvatarUrl,
                m.Content,
                m.ReplyToMessageId,
                m.CreatedAt,
                replyM.Content AS ReplyToMessageSnippet,
                COALESCE(replyProf.FullName, replyU.Email) AS ReplyToSenderName
            FROM dbo.Messages m
            INNER JOIN dbo.Users u ON m.SenderId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            LEFT JOIN dbo.Messages replyM ON m.ReplyToMessageId = replyM.Id
            LEFT JOIN dbo.Users replyU ON replyM.SenderId = replyU.Id
            LEFT JOIN dbo.UserProfiles replyProf ON replyU.Id = replyProf.UserId
            WHERE m.Id = @MessageId;";

        var msg = await connection.QueryFirstOrDefaultAsync<ChatMessageDto>(messageSql, new { MessageId = messageId });
        if (msg == null) return null;

        // Attachments
        const string attachmentsSql = @"
            SELECT 
                ma.Id,
                ma.MessageId,
                ma.AttachmentType,
                ma.MediaUrl,
                ma.FileName,
                ma.FileSizeBytes,
                ma.DurationSeconds,
                ma.DisplayOrder,
                ma.PlaceId,
                p.Name AS PlaceName,
                p.CoverImageUrl AS PlaceCoverUrl,
                ma.FoodId,
                f.Name AS FoodName,
                f.CoverImageUrl AS FoodCoverUrl,
                ma.TripId,
                t.Title AS TripTitle,
                t.CoverImageUrl AS TripCoverUrl
            FROM dbo.MessageAttachments ma
            LEFT JOIN dbo.Places p ON ma.PlaceId = p.Id
            LEFT JOIN dbo.Foods f ON ma.FoodId = f.Id
            LEFT JOIN dbo.Trips t ON ma.TripId = t.Id
            WHERE ma.MessageId = @MessageId
            ORDER BY ma.DisplayOrder, ma.Id;";

        var attachmentRows = await connection.QueryAsync(attachmentsSql, new { MessageId = messageId });
        msg.Attachments = attachmentRows.Select(a => new MessageAttachmentDto
        {
            Id = (long)a.Id,
            AttachmentType = (MessageAttachmentType)(byte)a.AttachmentType,
            MediaUrl = (string?)a.MediaUrl,
            FileName = (string?)a.FileName,
            FileSizeBytes = a.FileSizeBytes != null ? (long)a.FileSizeBytes : null,
            DurationSeconds = a.DurationSeconds != null ? (int)a.DurationSeconds : null,
            DisplayOrder = (int)a.DisplayOrder,
            PlaceId = a.PlaceId != null ? (long)a.PlaceId : null,
            PlaceName = (string?)a.PlaceName,
            PlaceCoverUrl = (string?)a.PlaceCoverUrl,
            FoodId = a.FoodId != null ? (long)a.FoodId : null,
            FoodName = (string?)a.FoodName,
            FoodCoverUrl = (string?)a.FoodCoverUrl,
            TripId = a.TripId != null ? (long)a.TripId : null,
            TripTitle = (string?)a.TripTitle,
            TripCoverUrl = (string?)a.TripCoverUrl
        }).ToList();

        // Reactions
        const string reactionsSql = @"
            SELECT 
                mr.MessageId,
                mr.UserId,
                COALESCE(prof.FullName, u.Email, N'Người dùng') AS UserName,
                mr.Emoji,
                mr.CreatedAt
            FROM dbo.MessageReactions mr
            INNER JOIN dbo.Users u ON mr.UserId = u.Id
            LEFT JOIN dbo.UserProfiles prof ON u.Id = prof.UserId
            WHERE mr.MessageId = @MessageId
            ORDER BY mr.CreatedAt;";

        var reactionRows = await connection.QueryAsync<MessageReactionDto>(reactionsSql, new { MessageId = messageId });
        msg.Reactions = reactionRows.ToList();

        return msg;
    }

    public async Task<ChatMessageDto> SendMessageAsync(
        long roomId,
        long senderId,
        string? content,
        long? replyToMessageId = null,
        IReadOnlyList<CreateAttachmentInput>? attachments = null,
        CancellationToken ct = default)
    {
        var message = new Message(roomId, senderId, content, replyToMessageId);

        if (attachments != null)
        {
            for (int i = 0; i < attachments.Count; i++)
            {
                var input = attachments[i];
                var attachment = new MessageAttachment(
                    messageId: 0,
                    attachmentType: input.AttachmentType,
                    placeId: input.PlaceId,
                    foodId: input.FoodId,
                    tripId: input.TripId,
                    mediaUrl: input.MediaUrl,
                    fileName: input.FileName,
                    fileSizeBytes: input.FileSizeBytes,
                    durationSeconds: input.DurationSeconds,
                    displayOrder: i);

                message.AddAttachment(attachment);
            }
        }

        _dbContext.Messages.Add(message);

        // Tự động cập nhật LastReadAt cho người gửi
        var member = await _dbContext.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == roomId && m.UserId == senderId, ct);

        if (member != null)
        {
            member.MarkRead(DateTime.UtcNow);
        }

        await _dbContext.SaveChangesAsync(ct);

        var createdDto = await GetMessageByIdAsync(message.Id, ct);
        return createdDto ?? throw new InvalidOperationException("Không thể lấy thông tin tin nhắn vừa tạo.");
    }

    public async Task<bool> MarkRoomAsReadAsync(long roomId, long userId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            UPDATE dbo.ChatRoomMembers
            SET LastReadAt = SYSUTCDATETIME()
            WHERE ChatRoomId = @RoomId AND UserId = @UserId;";

        var rows = await connection.ExecuteAsync(sql, new { RoomId = roomId, UserId = userId });
        return rows > 0;
    }

    public async Task<bool> AddReactionAsync(long messageId, long userId, string emoji, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        // Kiểm tra xem tin nhắn có tồn tại không
        const string checkSql = "SELECT COUNT(1) FROM dbo.Messages WHERE Id = @MessageId;";
        var exists = await connection.ExecuteScalarAsync<int>(checkSql, new { MessageId = messageId });
        if (exists == 0) return false;

        const string mergeSql = @"
            MERGE dbo.MessageReactions AS target
            USING (SELECT @MessageId AS MessageId, @UserId AS UserId, @Emoji AS Emoji) AS source
            ON target.MessageId = source.MessageId AND target.UserId = source.UserId
            WHEN MATCHED THEN
                UPDATE SET target.Emoji = source.Emoji, target.CreatedAt = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (MessageId, UserId, Emoji, CreatedAt)
                VALUES (source.MessageId, source.UserId, source.Emoji, SYSUTCDATETIME());";

        await connection.ExecuteAsync(mergeSql, new
        {
            MessageId = messageId,
            UserId = userId,
            Emoji = emoji
        });

        return true;
    }

    public async Task<long> CreateGroupRoomAsync(string name, long creatorId, IReadOnlyList<long> memberIds, CancellationToken ct = default)
    {
        var newRoom = new ChatRoom(name: name, isGroup: true);
        _dbContext.ChatRooms.Add(newRoom);
        await _dbContext.SaveChangesAsync(ct);

        // 1. Tạo và lưu Quản trị viên (người gửi yêu cầu tạo nhóm) ĐẦU TIÊN
        var creatorMember = new ChatRoomMember(newRoom.Id, creatorId);
        _dbContext.ChatRoomMembers.Add(creatorMember);
        await _dbContext.SaveChangesAsync(ct);

        // 2. Thêm các thành viên còn lại
        var otherMemberIds = memberIds
            .Where(id => id > 0 && id != creatorId)
            .Distinct()
            .ToList();

        if (otherMemberIds.Count > 0)
        {
            var otherMembers = otherMemberIds
                .Select(uid => new ChatRoomMember(newRoom.Id, uid))
                .ToList();

            _dbContext.ChatRoomMembers.AddRange(otherMembers);
            await _dbContext.SaveChangesAsync(ct);
        }

        return newRoom.Id;
    }

    public async Task<bool> AddMembersToRoomAsync(long roomId, IReadOnlyList<long> userIds, CancellationToken ct = default)
    {
        var existingMemberIds = await _dbContext.ChatRoomMembers
            .Where(m => m.ChatRoomId == roomId)
            .Select(m => m.UserId)
            .ToListAsync(ct);

        var toAdd = userIds.Distinct().Where(id => !existingMemberIds.Contains(id)).ToList();
        if (toAdd.Count > 0)
        {
            var members = toAdd.Select(uid => new ChatRoomMember(roomId, uid)).ToList();
            _dbContext.ChatRoomMembers.AddRange(members);
            await _dbContext.SaveChangesAsync(ct);
        }

        return true;
    }

    public async Task<bool> UpdateRoomNameAsync(long roomId, string name, CancellationToken ct = default)
    {
        var room = await _dbContext.ChatRooms.FirstOrDefaultAsync(r => r.Id == roomId, ct);
        if (room == null) return false;

        room.UpdateName(name);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RemoveMemberFromRoomAsync(long roomId, long userId, CancellationToken ct = default)
    {
        var member = await _dbContext.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == roomId && m.UserId == userId, ct);
        if (member == null) return false;

        _dbContext.ChatRoomMembers.Remove(member);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DisbandGroupRoomAsync(long roomId, CancellationToken ct = default)
    {
        var members = await _dbContext.ChatRoomMembers
            .Where(m => m.ChatRoomId == roomId)
            .ToListAsync(ct);

        if (members.Count > 0)
        {
            _dbContext.ChatRoomMembers.RemoveRange(members);
            await _dbContext.SaveChangesAsync(ct);
        }
        return true;
    }

    public async Task<ChatRoom?> GetRoomByIdAsync(long roomId, CancellationToken ct = default)
    {
        return await _dbContext.ChatRooms.FirstOrDefaultAsync(r => r.Id == roomId, ct);
    }

    public async Task<IReadOnlyList<long>> GetRoomMemberUserIdsAsync(long roomId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = "SELECT UserId FROM dbo.ChatRoomMembers WHERE ChatRoomId = @RoomId;";
        var userIds = await connection.QueryAsync<long>(sql, new { RoomId = roomId });
        return userIds.ToList();
    }

    public async Task<IReadOnlyList<long>> GetRoomIdsForUserAsync(long userId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = "SELECT ChatRoomId FROM dbo.ChatRoomMembers WHERE UserId = @UserId;";
        var roomIds = await connection.QueryAsync<long>(sql, new { UserId = userId });
        return roomIds.ToList();
    }

    public async Task<IReadOnlyList<ChatRoomMemberDto>> GetRoomMembersAsync(long roomId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            SELECT 
                m.UserId,
                COALESCE(p.FullName, u.Email, N'Người dùng') AS Name,
                p.AvatarUrl,
                u.Email,
                m.JoinedAt,
                CASE 
                    WHEN ROW_NUMBER() OVER (ORDER BY m.JoinedAt ASC) = 1 THEN CAST(1 AS BIT)
                    ELSE CAST(0 AS BIT)
                END AS IsAdmin,
                CASE 
                    WHEN ROW_NUMBER() OVER (ORDER BY m.JoinedAt ASC) = 1 THEN 'Admin'
                    ELSE 'Member'
                END AS Role
            FROM dbo.ChatRoomMembers m
            INNER JOIN dbo.Users u ON m.UserId = u.Id
            LEFT JOIN dbo.UserProfiles p ON u.Id = p.UserId
            WHERE m.ChatRoomId = @RoomId
            ORDER BY m.JoinedAt ASC;";

        var members = await connection.QueryAsync<ChatRoomMemberDto>(sql, new { RoomId = roomId });
        return members.ToList();
    }

    public async Task<bool> UpdateMessageContentAsync(long messageId, long senderId, string newContent, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        const string sql = @"
            UPDATE dbo.Messages
            SET Content = @Content
            WHERE Id = @MessageId AND SenderId = @SenderId;";

        var rows = await connection.ExecuteAsync(sql, new
        {
            MessageId = messageId,
            SenderId = senderId,
            Content = newContent
        });

        return rows > 0;
    }

    public async Task<bool> DeleteMessageAsync(long messageId, long senderId, CancellationToken ct = default)
    {
        var connection = _dbContext.Database.GetDbConnection();

        const string checkSql = "SELECT COUNT(1) FROM dbo.Messages WHERE Id = @MessageId AND SenderId = @SenderId;";
        var count = await connection.ExecuteScalarAsync<int>(checkSql, new { MessageId = messageId, SenderId = senderId });
        if (count == 0) return false;

        const string deleteSql = @"
            UPDATE dbo.Messages SET ReplyToMessageId = NULL WHERE ReplyToMessageId = @MessageId;
            DELETE FROM dbo.MessageAttachments WHERE MessageId = @MessageId;
            DELETE FROM dbo.MessageReactions WHERE MessageId = @MessageId;
            DELETE FROM dbo.Messages WHERE Id = @MessageId AND SenderId = @SenderId;";

        var rows = await connection.ExecuteAsync(deleteSql, new { MessageId = messageId, SenderId = senderId });
        return rows > 0;
    }
}
