using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Proposals;

public record GetAdminProposalDetailQuery(long Id) : IRequest<Result<AdminProposalDto>>;

public class GetAdminProposalDetailQueryHandler : IRequestHandler<GetAdminProposalDetailQuery, Result<AdminProposalDto>>
{
    private readonly IAdminProposalRepository _proposalRepository;

    public GetAdminProposalDetailQueryHandler(IAdminProposalRepository proposalRepository)
    {
        _proposalRepository = proposalRepository;
    }

    public async Task<Result<AdminProposalDto>> Handle(GetAdminProposalDetailQuery request, CancellationToken ct)
    {
        var proposal = await _proposalRepository.GetProposalDetailAsync(request.Id, ct);
        if (proposal == null)
        {
            return Result<AdminProposalDto>.NotFound("Không tìm thấy đề xuất yêu cầu.");
        }

        return Result<AdminProposalDto>.Success(proposal);
    }
}
