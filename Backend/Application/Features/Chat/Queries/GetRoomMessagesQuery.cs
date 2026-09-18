using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Chat.Queries;

public record GetRoomMessagesQuery(
    long RoomId,
    long UserId,
    int Page = 1,
    int Limit = 20) : IRequest<Result<IReadOnlyList<ChatMessageDto>>>;

public class GetRoomMessagesQueryHandler : IRequestHandler<GetRoomMessagesQuery, Result<IReadOnlyList<ChatMessageDto>>>
{
    private readonly IChatRepository _chatRepository;

    public GetRoomMessagesQueryHandler(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    public async Task<Result<IReadOnlyList<ChatMessageDto>>> Handle(GetRoomMessagesQuery request, CancellationToken ct)
    {
        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.UserId, ct);
        if (!isMember)
        {
            return Result<IReadOnlyList<ChatMessageDto>>.Forbidden("Bạn không có quyền truy cập vào phòng trò chuyện này.");
        }

        var limit = Math.Clamp(request.Limit, 1, 100);
        var page = Math.Max(1, request.Page);

        var messages = await _chatRepository.GetRoomMessagesAsync(request.RoomId, request.UserId, page, limit, ct);
        return Result<IReadOnlyList<ChatMessageDto>>.Success(messages);
    }
}
