using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface ICollectionRepository
{
    Task<List<CollectionDto>> GetFeaturedCollectionsAsync(int count = 6, CancellationToken ct = default);
}
