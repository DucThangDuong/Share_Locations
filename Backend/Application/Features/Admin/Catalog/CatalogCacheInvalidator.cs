using Application.Common.Interfaces;

namespace Application.Features.Admin.Catalog;

public static class CatalogCacheInvalidator
{
    public static async Task InvalidateCatalogCachesAsync(ICacheService cacheService, CancellationToken ct = default)
    {
        await cacheService.RemoveAsync("catalog:placetypes:all", ct);
        await cacheService.RemoveAsync("places:filter-options", ct);
        await cacheService.RemoveAsync("collections:featured", ct);

        await cacheService.RemoveByPatternAsync("catalog:*", ct);
        await cacheService.RemoveByPatternAsync("places:*", ct);
        await cacheService.RemoveByPatternAsync("collections:*", ct);
        await cacheService.RemoveByPatternAsync("geography:*", ct);
    }
}
