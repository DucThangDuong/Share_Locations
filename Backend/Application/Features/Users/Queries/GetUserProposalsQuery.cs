using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserProposalsQuery(
    long TargetUserId,
    long? CurrentUserId = null,
    int? Status = null,
    int Page = 1,
    int PageSize = 15) : IRequest<Result<UserProposalPagedResultDto>>;

public class GetUserProposalsQueryHandler : IRequestHandler<GetUserProposalsQuery, Result<UserProposalPagedResultDto>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserProposalsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<UserProposalPagedResultDto>> Handle(GetUserProposalsQuery request, CancellationToken ct)
    {
        // Chỉ lấy các địa điểm đã được công bố / phê duyệt thành công (Status = 1)
        const int approvedStatus = 1;

        var result = await _repo.GetProposalsAsync(
            request.TargetUserId,
            approvedStatus,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 15,
            ct);

        return Result<UserProposalPagedResultDto>.Success(result, "Lấy danh sách địa điểm đã duyệt thành công.");
    }
}
