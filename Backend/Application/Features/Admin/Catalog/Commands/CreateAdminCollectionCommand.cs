using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Admin.Catalog.Commands;

public record CreateAdminCollectionCommand(
    string Title,
    string? Description,
    int? ProvinceId,
    string? CoverUrl,
    int? DisplayOrder,
    bool IsFeatured,
    int? Status,
    IReadOnlyList<CollectionPlaceInputDto>? Places) : IRequest<Result<AdminCollectionCreatedDto>>;

public class CreateAdminCollectionCommandHandler : IRequestHandler<CreateAdminCollectionCommand, Result<AdminCollectionCreatedDto>>
{
    private readonly ICollectionRepository _collectionRepository;
    private readonly ICacheService _cacheService;

    public CreateAdminCollectionCommandHandler(ICollectionRepository collectionRepository, ICacheService cacheService)
    {
        _collectionRepository = collectionRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<AdminCollectionCreatedDto>> Handle(CreateAdminCollectionCommand request, CancellationToken ct)
    {
        var result = await _collectionRepository.CreateCollectionAsync(
            request.Title,
            request.Description,
            request.ProvinceId,
            request.CoverUrl,
            request.DisplayOrder,
            request.IsFeatured,
            request.Status,
            request.Places,
            ct);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:6", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:12", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:50", ct);
        }

        return result;
    }
}
