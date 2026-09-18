using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Application.Common.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.Hubs;

[Authorize]
public class ChatHub : Hub<IChatClient>
{
    private readonly IChatRepository _chatRepository;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IChatRepository chatRepository, ILogger<ChatHub> logger)
    {
        _chatRepository = chatRepository;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            try
            {
                var roomIds = await _chatRepository.GetRoomIdsForUserAsync(userId.Value);
                foreach (var roomId in roomIds)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, GetRoomGroupName(roomId));
                }
                _logger.LogDebug("Auto-joined {Count} rooms on connect for User {UserId}.", roomIds.Count, userId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error auto-joining rooms on connection for user {UserId}", userId);
            }
        }
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(long roomId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return;

        var isMember = await _chatRepository.IsUserInRoomAsync(roomId, userId.Value);
        if (!isMember)
        {
            _logger.LogWarning("User {UserId} attempted to join Room {RoomId} without membership.", userId, roomId);
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GetRoomGroupName(roomId));
        _logger.LogDebug("User {UserId} joined SignalR group for Room {RoomId}.", userId, roomId);
    }

    public async Task LeaveRoom(long roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetRoomGroupName(roomId));
        _logger.LogDebug("Connection {ConnectionId} left SignalR group for Room {RoomId}.", Context.ConnectionId, roomId);
    }

    public async Task SendTyping(long roomId, bool isTyping)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return;

        await Clients.OthersInGroup(GetRoomGroupName(roomId)).UserTyping(roomId, userId.Value, isTyping);
    }

    public static string GetRoomGroupName(long roomId) => $"Room_{roomId}";

    private long? GetCurrentUserId()
    {
        var principal = Context.User;
        if (principal == null) return null;

        var userIdStr = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? principal.FindFirst("sub")?.Value;

        return long.TryParse(userIdStr, out var id) ? id : null;
    }
}