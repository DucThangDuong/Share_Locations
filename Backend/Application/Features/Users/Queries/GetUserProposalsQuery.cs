using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserProposalsQuery(
    long UserId,
    int? Status,
    int Page,
    int PageSize) : IRequest<Result<UserProposalPagedResultDto>>;

public class GetUserProposalsQueryHandler : IRequestHandler<GetUserProposalsQuery, Result<UserProposalPagedResultDto>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserProposalsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<UserProposalPagedResultDto>> Handle(GetUserProposalsQuery request, CancellationToken ct)
    {
        var result = await _repo.GetProposalsAsync(
            request.UserId,
            request.Status,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 12,
            ct);

        return Result<UserProposalPagedResultDto>.Success(result, "Lấy danh sách đề xuất thành công.");
    }
}
