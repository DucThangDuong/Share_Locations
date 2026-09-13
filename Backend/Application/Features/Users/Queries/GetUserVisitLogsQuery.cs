using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserVisitLogsQuery(
    long UserId,
    int? Privacy,
    int Page,
    int PageSize) : IRequest<Result<UserVisitLogPagedResultDto>>;

public class GetUserVisitLogsQueryHandler : IRequestHandler<GetUserVisitLogsQuery, Result<UserVisitLogPagedResultDto>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserVisitLogsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<UserVisitLogPagedResultDto>> Handle(GetUserVisitLogsQuery request, CancellationToken ct)
    {
        var result = await _repo.GetVisitLogsAsync(
            request.UserId,
            request.Privacy,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 12,
            ct);

        return Result<UserVisitLogPagedResultDto>.Success(result, "Lấy danh sách nhật ký hành trình thành công.");
    }
}
