using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Catalog.Commands;

public record UpdateCollectionPlacesCommand(
    int CollectionId,
    IReadOnlyList<CollectionPlaceInputDto> Places,
    bool ReplaceExisting = false,
    string? Description = null,
    int? ProvinceId = null,
    string? Title = null) : IRequest<Result<UpdateCollectionPlacesResultDto>>;

public class UpdateCollectionPlacesCommandHandler : IRequestHandler<UpdateCollectionPlacesCommand, Result<UpdateCollectionPlacesResultDto>>
{
    private readonly ICollectionRepository _collectionRepository;
    private readonly ICacheService _cacheService;

    public UpdateCollectionPlacesCommandHandler(ICollectionRepository collectionRepository, ICacheService cacheService)
    {
        _collectionRepository = collectionRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<UpdateCollectionPlacesResultDto>> Handle(UpdateCollectionPlacesCommand request, CancellationToken ct)
    {
        var result = await _collectionRepository.AddOrUpdatePlacesAsync(
            request.CollectionId,
            request.Places,
            request.ReplaceExisting,
            request.Description,
            request.ProvinceId,
            request.Title,
            ct);

        if (result.IsSuccess)
        {
            // Xóa cache các danh sách collection nổi bật để đồng bộ dữ liệu mới nhất
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:6", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:12", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:50", ct);
        }

        return result;
    }
}
