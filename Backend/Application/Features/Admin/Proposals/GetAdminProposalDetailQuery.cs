using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Proposals;

public record GetAdminProposalDetailQuery(long Id) : IRequest<Result<AdminProposalDetailDto>>;

public class GetAdminProposalDetailQueryHandler : IRequestHandler<GetAdminProposalDetailQuery, Result<AdminProposalDetailDto>>
{
    private readonly IAdminProposalRepository _proposalRepository;

    public GetAdminProposalDetailQueryHandler(IAdminProposalRepository proposalRepository)
    {
        _proposalRepository = proposalRepository;
    }

    public async Task<Result<AdminProposalDetailDto>> Handle(GetAdminProposalDetailQuery request, CancellationToken ct)
    {
        var proposal = await _proposalRepository.GetProposalDetailAsync(request.Id, ct);
        if (proposal == null)
        {
            return Result<AdminProposalDetailDto>.NotFound("Không tìm thấy đề xuất yêu cầu.");
        }

        return Result<AdminProposalDetailDto>.Success(proposal);
    }
}
