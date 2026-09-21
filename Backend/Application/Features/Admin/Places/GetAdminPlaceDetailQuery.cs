using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Places;

public record GetAdminPlaceDetailQuery(long Id) : IRequest<Result<AdminPlaceDetailDto>>;

public class GetAdminPlaceDetailQueryHandler : IRequestHandler<GetAdminPlaceDetailQuery, Result<AdminPlaceDetailDto>>
{
    private readonly IAdminPlaceRepository _placeRepository;

    public GetAdminPlaceDetailQueryHandler(IAdminPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<AdminPlaceDetailDto>> Handle(GetAdminPlaceDetailQuery request, CancellationToken ct)
    {
        var place = await _placeRepository.GetAdminPlaceDetailAsync(request.Id, ct);
        if (place == null)
        {
            return Result<AdminPlaceDetailDto>.NotFound("Không tìm thấy địa điểm yêu cầu.");
        }

        return Result<AdminPlaceDetailDto>.Success(place);
    }
}
