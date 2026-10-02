using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Admin.Catalog.Commands;

public record UpdateAdminCollectionStatusCommand(int Id, int Status) : IRequest<Result<UpdateCollectionStatusResultDto>>;

public class UpdateAdminCollectionStatusCommandHandler : IRequestHandler<UpdateAdminCollectionStatusCommand, Result<UpdateCollectionStatusResultDto>>
{
    private readonly ICollectionRepository _collectionRepository;
    private readonly ICacheService _cacheService;

    public UpdateAdminCollectionStatusCommandHandler(ICollectionRepository collectionRepository, ICacheService cacheService)
    {
        _collectionRepository = collectionRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<UpdateCollectionStatusResultDto>> Handle(UpdateAdminCollectionStatusCommand request, CancellationToken ct)
    {
        var result = await _collectionRepository.UpdateStatusAsync(request.Id, request.Status, ct);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:6", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:12", ct);
            await _cacheService.RemoveAsync("catalog:collections:featured:v2:50", ct);
        }

        return result;
    }
}
