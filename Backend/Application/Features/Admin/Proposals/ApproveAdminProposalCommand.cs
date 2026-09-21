using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Proposals;

public record ApproveAdminProposalCommand(
    long ProposalId,
    long AdminId,
    long? TargetPlaceId = null) : IRequest<Result<bool>>;

public class ApproveAdminProposalCommandHandler : IRequestHandler<ApproveAdminProposalCommand, Result<bool>>
{
    private readonly IAdminProposalRepository _proposalRepository;

    public ApproveAdminProposalCommandHandler(IAdminProposalRepository proposalRepository)
    {
        _proposalRepository = proposalRepository;
    }

    public async Task<Result<bool>> Handle(ApproveAdminProposalCommand request, CancellationToken ct)
    {
        var success = await _proposalRepository.ApproveProposalAsync(
            request.ProposalId,
            request.AdminId,
            request.TargetPlaceId,
            ct);

        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy đề xuất đóng góp.");
        }

        return Result<bool>.Success(true, "Đã phê duyệt đề xuất thành công.");
    }
}
