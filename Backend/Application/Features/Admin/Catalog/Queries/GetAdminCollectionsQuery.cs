using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Admin.Catalog.Queries;

public record GetAdminCollectionsQuery : IRequest<Result<IReadOnlyList<AdminCollectionSummaryDto>>>;

public class GetAdminCollectionsQueryHandler : IRequestHandler<GetAdminCollectionsQuery, Result<IReadOnlyList<AdminCollectionSummaryDto>>>
{
    private readonly ICollectionRepository _collectionRepository;

    public GetAdminCollectionsQueryHandler(ICollectionRepository collectionRepository)
    {
        _collectionRepository = collectionRepository;
    }

    public async Task<Result<IReadOnlyList<AdminCollectionSummaryDto>>> Handle(GetAdminCollectionsQuery request, CancellationToken ct)
    {
        var collections = await _collectionRepository.GetAdminCollectionsAsync(ct);
        return Result<IReadOnlyList<AdminCollectionSummaryDto>>.Success(collections, "Lấy danh sách bộ sưu tập thành công.");
    }
}
