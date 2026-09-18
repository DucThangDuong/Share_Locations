using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Chat.Queries;

public record GetRoomMembersQuery(long RoomId, long RequesterId) : IRequest<Result<IReadOnlyList<ChatRoomMemberDto>>>;

public class GetRoomMembersQueryHandler : IRequestHandler<GetRoomMembersQuery, Result<IReadOnlyList<ChatRoomMemberDto>>>
{
    private readonly IChatRepository _chatRepository;

    public GetRoomMembersQueryHandler(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    public async Task<Result<IReadOnlyList<ChatRoomMemberDto>>> Handle(GetRoomMembersQuery request, CancellationToken ct)
    {
        var isMember = await _chatRepository.IsUserInRoomAsync(request.RoomId, request.RequesterId, ct);
        if (!isMember)
        {
            return Result<IReadOnlyList<ChatRoomMemberDto>>.Forbidden("Bạn không có quyền xem danh sách thành viên phòng chat này.");
        }

        var members = await _chatRepository.GetRoomMembersAsync(request.RoomId, ct);
        return Result<IReadOnlyList<ChatRoomMemberDto>>.Success(members);
    }
}