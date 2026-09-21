using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Proposals;

public record RejectAdminProposalCommand(
    long ProposalId,
    long AdminId,
    string RejectionReason) : IRequest<Result<bool>>;

public class RejectAdminProposalCommandHandler : IRequestHandler<RejectAdminProposalCommand, Result<bool>>
{
    private readonly IAdminProposalRepository _proposalRepository;

    public RejectAdminProposalCommandHandler(IAdminProposalRepository proposalRepository)
    {
        _proposalRepository = proposalRepository;
    }

    public async Task<Result<bool>> Handle(RejectAdminProposalCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            return Result<bool>.Failure("Vui lòng nhập lý do từ chối đề xuất.");
        }

        var success = await _proposalRepository.RejectProposalAsync(
            request.ProposalId,
            request.AdminId,
            request.RejectionReason.Trim(),
            ct);

        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy đề xuất đóng góp.");
        }

        return Result<bool>.Success(true, "Đã từ chối đề xuất đóng góp.");
    }
}
