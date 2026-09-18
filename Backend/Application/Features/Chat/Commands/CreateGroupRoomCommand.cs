using Application.Common;
using Application.Common.Interfaces.Repositories;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Chat.Commands;

public record CreateGroupRoomCommand(long CreatorId, string Name, IReadOnlyList<long> MemberIds) : IRequest<Result<long>>;

public class CreateGroupRoomCommandHandler : IRequestHandler<CreateGroupRoomCommand, Result<long>>
{
    private readonly IChatRepository _chatRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateGroupRoomCommandHandler(IChatRepository chatRepository, IUnitOfWork unitOfWork)
    {
        _chatRepository = chatRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateGroupRoomCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<long>.Failure("Tên nhóm không được để trống.");
        }

        var cleanName = request.Name.Trim();
        if (cleanName.Length > 100)
        {
            return Result<long>.Failure("Tên nhóm không được vượt quá 100 ký tự.");
        }

        var validMemberIds = request.MemberIds?
            .Where(id => id > 0 && id != request.CreatorId)
            .Distinct()
            .ToList() ?? new List<long>();

        if (validMemberIds.Count == 0)
        {
            return Result<long>.Failure("Nhóm cần có ít nhất 1 thành viên khác.");
        }

        var roomId = await _chatRepository.CreateGroupRoomAsync(cleanName, request.CreatorId, validMemberIds, ct);
        return Result<long>.Success(roomId, "Tạo nhóm trò chuyện thành công.");
    }
}