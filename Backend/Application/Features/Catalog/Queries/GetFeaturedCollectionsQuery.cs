using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Catalog.Queries;

public record GetFeaturedCollectionsQuery(int Count = 6) : IRequest<Result<IReadOnlyList<CollectionDto>>>;

public class GetFeaturedCollectionsQueryHandler : IRequestHandler<GetFeaturedCollectionsQuery, Result<IReadOnlyList<CollectionDto>>>
{
    private readonly ICollectionRepository _collectionRepository;
    private readonly ICacheService _cacheService;

    public GetFeaturedCollectionsQueryHandler(ICollectionRepository collectionRepository, ICacheService cacheService)
    {
        _collectionRepository = collectionRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<CollectionDto>>> Handle(GetFeaturedCollectionsQuery request, CancellationToken ct)
    {
        var cacheKey = $"catalog:collections:featured:{request.Count}";

        var cached = await _cacheService.GetAsync<IReadOnlyList<CollectionDto>>(cacheKey, ct);
        if (cached != null && cached.Count > 0)
        {
            return Result<IReadOnlyList<CollectionDto>>.Success(cached);
        }

        var collections = await _collectionRepository.GetFeaturedCollectionsAsync(request.Count, ct);

        if (collections.Count > 0)
        {
            await _cacheService.SetAsync(cacheKey, collections, TimeSpan.FromMinutes(30), ct);
        }

        return Result<IReadOnlyList<CollectionDto>>.Success(collections);
    }
}
