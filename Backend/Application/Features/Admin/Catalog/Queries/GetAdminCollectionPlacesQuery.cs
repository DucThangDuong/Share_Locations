using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Admin.Catalog.Queries;

public record GetAdminCollectionPlacesQuery(int CollectionId) : IRequest<Result<AdminCollectionDetailPlacesDto>>;

public class GetAdminCollectionPlacesQueryHandler : IRequestHandler<GetAdminCollectionPlacesQuery, Result<AdminCollectionDetailPlacesDto>>
{
    private readonly ICollectionRepository _collectionRepository;

    public GetAdminCollectionPlacesQueryHandler(ICollectionRepository collectionRepository)
    {
        _collectionRepository = collectionRepository;
    }

    public async Task<Result<AdminCollectionDetailPlacesDto>> Handle(GetAdminCollectionPlacesQuery request, CancellationToken ct)
    {
        return await _collectionRepository.GetCollectionPlacesDetailAsync(request.CollectionId, ct);
    }
}
