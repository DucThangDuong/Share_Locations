using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Proposals;

public record GetAdminProposalsQuery(
    int? Status = null,
    string? Keyword = null,
    int? ProvinceId = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<AdminProposalSummaryDto>>>;

public class GetAdminProposalsQueryHandler : IRequestHandler<GetAdminProposalsQuery, Result<PagedResult<AdminProposalSummaryDto>>>
{
    private readonly IAdminProposalRepository _proposalRepository;

    public GetAdminProposalsQueryHandler(IAdminProposalRepository proposalRepository)
    {
        _proposalRepository = proposalRepository;
    }

    public async Task<Result<PagedResult<AdminProposalSummaryDto>>> Handle(GetAdminProposalsQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var result = await _proposalRepository.GetProposalsAsync(
            request.Status,
            request.Keyword,
            request.ProvinceId,
            page,
            pageSize,
            ct);

        return Result<PagedResult<AdminProposalSummaryDto>>.Success(result);
    }
}
