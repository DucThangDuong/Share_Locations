using Application.Common;
using Application.Common.Interfaces.Repositories;
using Domain.Enums;
using MediatR;

namespace Application.Features.Admin.Places;

public record UpdateAdminPlaceStatusCommand(long Id, int StatusNum, string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminPlaceStatusCommandHandler : IRequestHandler<UpdateAdminPlaceStatusCommand, Result<bool>>
{
    private readonly IAdminPlaceRepository _placeRepository;

    public UpdateAdminPlaceStatusCommandHandler(IAdminPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<bool>> Handle(UpdateAdminPlaceStatusCommand request, CancellationToken ct)
    {
        var status = (PlaceStatus)request.StatusNum;
        var success = await _placeRepository.UpdateAdminPlaceStatusAsync(request.Id, status, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy địa điểm yêu cầu.");
        }

        return Result<bool>.Success(true, "Cập nhật trạng thái địa điểm thành công.");
    }
}
