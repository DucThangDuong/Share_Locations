using API.Hubs;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;

namespace API.Services;

public class ChatNotifier : IChatNotifier
{
    private readonly IHubContext<ChatHub, IChatClient> _hubContext;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ChatNotifier> _logger;

    public ChatNotifier(
        IHubContext<ChatHub, IChatClient> hubContext,
        IServiceProvider serviceProvider,
        ILogger<ChatNotifier> logger)
    {
        _hubContext = hubContext;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task NotifyMessageReceivedAsync(long roomId, ChatMessageDto message, CancellationToken ct = default)
    {
        var groupName = ChatHub.GetRoomGroupName(roomId);
        _logger.LogInformation("Broadcasting message {MessageId} to group {GroupName}", message.Id, groupName);

        // 1. Broadcast to SignalR Room Group
        await _hubContext.Clients.Group(groupName).ReceiveMessage(message);

        // 2. Also send directly to all member user IDs to ensure real-time delivery even if room group wasn't joined
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var chatRepo = scope.ServiceProvider.GetRequiredService<IChatRepository>();
            var memberIds = await chatRepo.GetRoomMemberUserIdsAsync(roomId, ct);
            if (memberIds.Count > 0)
            {
                var userIdentifiers = memberIds.Select(id => id.ToString()).ToList();
                await _hubContext.Clients.Users(userIdentifiers).ReceiveMessage(message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error sending direct user messages in ChatNotifier for room {RoomId}", roomId);
        }
    }

    public async Task NotifyMessageReadAsync(long roomId, long userId, DateTime readAt, CancellationToken ct = default)
    {
        var groupName = ChatHub.GetRoomGroupName(roomId);
        await _hubContext.Clients.Group(groupName).MessageRead(roomId, userId, readAt);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var chatRepo = scope.ServiceProvider.GetRequiredService<IChatRepository>();
            var memberIds = await chatRepo.GetRoomMemberUserIdsAsync(roomId, ct);
            if (memberIds.Count > 0)
            {
                var userIdentifiers = memberIds.Select(id => id.ToString()).ToList();
                await _hubContext.Clients.Users(userIdentifiers).MessageRead(roomId, userId, readAt);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error sending direct read notification for room {RoomId}", roomId);
        }
    }

    public async Task NotifyMessageReactedAsync(long roomId, long messageId, long userId, string emoji, CancellationToken ct = default)
    {
        var groupName = ChatHub.GetRoomGroupName(roomId);
        await _hubContext.Clients.Group(groupName).MessageReacted(roomId, messageId, userId, emoji);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var chatRepo = scope.ServiceProvider.GetRequiredService<IChatRepository>();
            var memberIds = await chatRepo.GetRoomMemberUserIdsAsync(roomId, ct);
            if (memberIds.Count > 0)
            {
                var userIdentifiers = memberIds.Select(id => id.ToString()).ToList();
                await _hubContext.Clients.Users(userIdentifiers).MessageReacted(roomId, messageId, userId, emoji);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error sending direct reaction notification for room {RoomId}", roomId);
        }
    }

    public async Task NotifyMessageEditedAsync(long roomId, long messageId, string newContent, CancellationToken ct = default)
    {
        var groupName = ChatHub.GetRoomGroupName(roomId);
        await _hubContext.Clients.Group(groupName).MessageEdited(roomId, messageId, newContent);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var chatRepo = scope.ServiceProvider.GetRequiredService<IChatRepository>();
            var memberIds = await chatRepo.GetRoomMemberUserIdsAsync(roomId, ct);
            if (memberIds.Count > 0)
            {
                var userIdentifiers = memberIds.Select(id => id.ToString()).ToList();
                await _hubContext.Clients.Users(userIdentifiers).MessageEdited(roomId, messageId, newContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error sending direct edit notification for room {RoomId}", roomId);
        }
    }

    public async Task NotifyMessageDeletedAsync(long roomId, long messageId, CancellationToken ct = default)
    {
        var groupName = ChatHub.GetRoomGroupName(roomId);
        await _hubContext.Clients.Group(groupName).MessageDeleted(roomId, messageId);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var chatRepo = scope.ServiceProvider.GetRequiredService<IChatRepository>();
            var memberIds = await chatRepo.GetRoomMemberUserIdsAsync(roomId, ct);
            if (memberIds.Count > 0)
            {
                var userIdentifiers = memberIds.Select(id => id.ToString()).ToList();
                await _hubContext.Clients.Users(userIdentifiers).MessageDeleted(roomId, messageId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error sending direct delete notification for room {RoomId}", roomId);
        }
    }
}