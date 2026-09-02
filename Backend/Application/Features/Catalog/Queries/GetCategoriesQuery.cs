using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Catalog.Queries;

public record GetCategoriesQuery() : IRequest<Result<IReadOnlyList<CategoryDto>>>;

public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, Result<IReadOnlyList<CategoryDto>>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICacheService _cacheService;

    public GetCategoriesQueryHandler(ICategoryRepository categoryRepository, ICacheService cacheService)
    {
        _categoryRepository = categoryRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken ct)
    {
        const string cacheKey = "catalog:categories:all";

        var cached = await _cacheService.GetAsync<IReadOnlyList<CategoryDto>>(cacheKey, ct);
        if (cached != null && cached.Count > 0)
        {
            return Result<IReadOnlyList<CategoryDto>>.Success(cached);
        }

        var categories = await _categoryRepository.GetAllAsync(ct);

        if (categories.Count > 0)
        {
            await _cacheService.SetAsync(cacheKey, categories, TimeSpan.FromHours(6), ct);
        }

        return Result<IReadOnlyList<CategoryDto>>.Success(categories);
    }
}
