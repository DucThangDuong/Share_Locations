using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserAccessHistoriesQuery(long UserId, int Limit) : IRequest<Result<IReadOnlyList<UserAccessHistoryItemDto>>>;

public class GetUserAccessHistoriesQueryHandler : IRequestHandler<GetUserAccessHistoriesQuery, Result<IReadOnlyList<UserAccessHistoryItemDto>>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserAccessHistoriesQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<IReadOnlyList<UserAccessHistoryItemDto>>> Handle(GetUserAccessHistoriesQuery request, CancellationToken ct)
    {
        var result = await _repo.GetAccessHistoriesAsync(
            request.UserId,
            request.Limit > 0 ? request.Limit : 10,
            ct);

        return Result<IReadOnlyList<UserAccessHistoryItemDto>>.Success(result, "Lấy lịch sử truy cập gần đây thành công.");
    }
}
