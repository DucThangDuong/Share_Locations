using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Proposals;

public record GetAdminProposalsQuery(
    int? Status = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<AdminProposalDto>>>;

public class GetAdminProposalsQueryHandler : IRequestHandler<GetAdminProposalsQuery, Result<PagedResult<AdminProposalDto>>>
{
    private readonly IAdminProposalRepository _proposalRepository;

    public GetAdminProposalsQueryHandler(IAdminProposalRepository proposalRepository)
    {
        _proposalRepository = proposalRepository;
    }

    public async Task<Result<PagedResult<AdminProposalDto>>> Handle(GetAdminProposalsQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var result = await _proposalRepository.GetProposalsAsync(
            request.Status,
            request.Keyword,
            page,
            pageSize,
            ct);

        return Result<PagedResult<AdminProposalDto>>.Success(result);
    }
}
