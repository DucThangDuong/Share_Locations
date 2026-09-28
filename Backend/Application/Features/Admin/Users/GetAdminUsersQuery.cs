using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Users;

public record GetAdminUsersQuery(
    string? Role,
    int? CategoryId,
    int? RegionId,
    int? ProvinceId,
    long? PlaceId,
    int? Status,
    string? Keyword,
    int Page,
    int PageSize) : IRequest<Result<PagedResult<AdminUserListItemDto>>>;

public class GetAdminUsersQueryHandler : IRequestHandler<GetAdminUsersQuery, Result<PagedResult<AdminUserListItemDto>>>
{
    private readonly IAdminUserRepository _userRepository;

    public GetAdminUsersQueryHandler(IAdminUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<PagedResult<AdminUserListItemDto>>> Handle(GetAdminUsersQuery request, CancellationToken ct)
    {
        var result = await _userRepository.GetAdminUsersAsync(
            request.Role,
            request.CategoryId,
            request.RegionId,
            request.ProvinceId,
            request.PlaceId,
            request.Status,
            request.Keyword,
            request.Page,
            request.PageSize,
            ct);

        return Result<PagedResult<AdminUserListItemDto>>.Success(result);
    }
}
