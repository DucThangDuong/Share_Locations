using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserFavoritesQuery(
    long UserId,
    int? TargetType,
    string? Keyword,
    string? SortBy,
    int Page,
    int PageSize) : IRequest<Result<UserFavoritePagedResultDto>>;

public class GetUserFavoritesQueryHandler : IRequestHandler<GetUserFavoritesQuery, Result<UserFavoritePagedResultDto>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserFavoritesQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<UserFavoritePagedResultDto>> Handle(GetUserFavoritesQuery request, CancellationToken ct)
    {
        var result = await _repo.GetFavoritesAsync(
            request.UserId,
            request.TargetType,
            request.Keyword,
            request.SortBy,
            request.Page > 0 ? request.Page : 1,
            request.PageSize > 0 ? request.PageSize : 12,
            ct);

        return Result<UserFavoritePagedResultDto>.Success(result, "Lấy danh sách mục đã lưu thành công.");
    }
}
