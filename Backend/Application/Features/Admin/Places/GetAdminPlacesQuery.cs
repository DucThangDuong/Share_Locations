using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Places;

public record GetAdminPlacesQuery(
    int? ProvinceId = null,
    int? CategoryId = null,
    int? Status = null,
    string? Keyword = null,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<AdminPlaceListItemDto>>>;

public class GetAdminPlacesQueryHandler : IRequestHandler<GetAdminPlacesQuery, Result<PagedResult<AdminPlaceListItemDto>>>
{
    private readonly IAdminPlaceRepository _placeRepository;

    public GetAdminPlacesQueryHandler(IAdminPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<PagedResult<AdminPlaceListItemDto>>> Handle(GetAdminPlacesQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var result = await _placeRepository.GetAdminPlacesAsync(
            request.ProvinceId,
            request.CategoryId,
            request.Status,
            request.Keyword,
            page,
            pageSize,
            ct);

        return Result<PagedResult<AdminPlaceListItemDto>>.Success(result);
    }
}
