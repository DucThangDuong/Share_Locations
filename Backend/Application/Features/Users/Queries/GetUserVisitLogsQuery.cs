using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserVisitLogsQuery(
    long TargetUserId,
    long? CurrentUserId = null,
    int? Privacy = null,
    int Page = 1,
    int PageSize = 15) : IRequest<Result<UserVisitLogPagedResultDto>>;

public class GetUserVisitLogsQueryHandler : IRequestHandler<GetUserVisitLogsQuery, Result<UserVisitLogPagedResultDto>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserVisitLogsQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<UserVisitLogPagedResultDto>> Handle(GetUserVisitLogsQuery request, CancellationToken ct)
    {
        bool isCurrentUser = request.CurrentUserId.HasValue && request.CurrentUserId.Value == request.TargetUserId;
        int? effectivePrivacy = !isCurrentUser ? 0 : request.Privacy;

        var result = await _repo.GetVisitLogsAsync(
            request.TargetUserId,
            effectivePrivacy,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 15,
            ct);

        return Result<UserVisitLogPagedResultDto>.Success(result, "Lấy danh sách nhật ký hành trình thành công.");
    }
}
