using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Users;

public record GetAdminAccessHistoryQuery(
    long UserId,
    int Page,
    int PageSize) : IRequest<Result<AdminAccessHistoryResultDto>>;

public class GetAdminAccessHistoryQueryHandler : IRequestHandler<GetAdminAccessHistoryQuery, Result<AdminAccessHistoryResultDto>>
{
    private readonly IAdminUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetAdminAccessHistoryQueryHandler(
        IAdminUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AdminAccessHistoryResultDto>> Handle(GetAdminAccessHistoryQuery request, CancellationToken ct)
    {
        // Chỉ có SystemAdmin hoặc chính Admin đó mới được xem lịch sử thao tác của mình!
        if (!_currentUserService.IsSystemAdmin && _currentUserService.UserId != request.UserId)
        {
            return Result<AdminAccessHistoryResultDto>.Failure("Bạn không có quyền xem nhật ký kiểm toán của quản trị viên khác.", HttpStatusCode.Forbidden);
        }

        var result = await _userRepository.GetAdminAccessHistoryAsync(
            request.UserId,
            request.Page,
            request.PageSize,
            ct);

        return Result<AdminAccessHistoryResultDto>.Success(result);
    }
}
