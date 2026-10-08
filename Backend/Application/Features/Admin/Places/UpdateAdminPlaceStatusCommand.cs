using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.Features.Admin.Catalog;
using Domain.Enums;
using MediatR;

namespace Application.Features.Admin.Places;

public record UpdateAdminPlaceStatusCommand(long Id, int StatusNum, string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminPlaceStatusCommandHandler : IRequestHandler<UpdateAdminPlaceStatusCommand, Result<bool>>
{
    private readonly IAdminPlaceRepository _placeRepository;
    private readonly ICacheService _cacheService;

    public UpdateAdminPlaceStatusCommandHandler(IAdminPlaceRepository placeRepository, ICacheService cacheService)
    {
        _placeRepository = placeRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminPlaceStatusCommand request, CancellationToken ct)
    {
        var status = (PlaceStatus)request.StatusNum;
        var success = await _placeRepository.UpdateAdminPlaceStatusAsync(request.Id, status, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy địa điểm yêu cầu.");
        }

        await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
        return Result<bool>.Success(true, "Cập nhật trạng thái địa điểm thành công.");
    }
}
