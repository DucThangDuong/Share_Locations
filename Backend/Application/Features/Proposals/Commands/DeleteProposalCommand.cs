using Application.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Proposals.Commands;

public record DeleteProposalCommand(long Id, long UserId) : IRequest<Result>;

public class DeleteProposalCommandHandler : IRequestHandler<DeleteProposalCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteProposalCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(DeleteProposalCommand request, CancellationToken ct)
    {
        var proposal = await _unitOfWork.Proposals.GetByIdAsync(request.Id, ct);
        if (proposal == null)
        {
            return Result.NotFound("Không tìm thấy đề xuất.");
        }

        if (proposal.UserId != request.UserId)
        {
            return Result.Forbidden("Bạn không có quyền xóa đề xuất này.");
        }

        if (proposal.Status == ProposalStatus.Approved)
        {
            return Result.Failure("Không thể thu hồi đề xuất đã được phê duyệt.");
        }

        _unitOfWork.Proposals.Remove(proposal);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã thu hồi đề xuất địa điểm.");
    }
}
