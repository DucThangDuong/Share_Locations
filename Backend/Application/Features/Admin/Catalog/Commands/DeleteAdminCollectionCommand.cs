using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Catalog.Commands;

public record DeleteAdminCollectionCommand(int Id) : IRequest<Result<bool>>;

public class DeleteAdminCollectionCommandHandler : IRequestHandler<DeleteAdminCollectionCommand, Result<bool>>
{
    private readonly ICollectionRepository _collectionRepository;
    private readonly ICacheService _cacheService;

    public DeleteAdminCollectionCommandHandler(ICollectionRepository collectionRepository, ICacheService cacheService)
    {
        _collectionRepository = collectionRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(DeleteAdminCollectionCommand request, CancellationToken ct)
    {
        var result = await _collectionRepository.DeleteCollectionAsync(request.Id, ct);

        if (result.IsSuccess)
        {
            await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:6", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:12", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:50", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:pool:v4:20", ct);
        }

        return result;
    }
}
