using Application.Common;
using Application.Common.Interfaces.Repositories;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Chat.Commands;

public record GetOrCreateDirectRoomCommand(long UserId, long TargetUserId) : IRequest<Result<long>>;

public class GetOrCreateDirectRoomCommandHandler : IRequestHandler<GetOrCreateDirectRoomCommand, Result<long>>
{
    private readonly IChatRepository _chatRepository;
    private readonly IUnitOfWork _unitOfWork;

    public GetOrCreateDirectRoomCommandHandler(IChatRepository chatRepository, IUnitOfWork unitOfWork)
    {
        _chatRepository = chatRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(GetOrCreateDirectRoomCommand request, CancellationToken ct)
    {
        if (request.UserId == request.TargetUserId)
        {
            return Result<long>.Failure("Bạn không thể tự trò chuyện với chính mình.");
        }

        var targetUser = await _unitOfWork.Users.GetByIdAsync(request.TargetUserId, ct);
        if (targetUser == null)
        {
            return Result<long>.NotFound("Người dùng không tồn tại.");
        }

        var roomId = await _chatRepository.GetOrCreateDirectRoomAsync(request.UserId, request.TargetUserId, ct);
        return Result<long>.Success(roomId);
    }
}
