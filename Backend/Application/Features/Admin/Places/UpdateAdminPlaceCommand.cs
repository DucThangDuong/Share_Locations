using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Places;

public record UpdateAdminPlaceCommand(long Id, UpdateAdminPlaceInput Input) : IRequest<Result<bool>>;

public class UpdateAdminPlaceCommandHandler : IRequestHandler<UpdateAdminPlaceCommand, Result<bool>>
{
    private readonly IAdminPlaceRepository _placeRepository;

    public UpdateAdminPlaceCommandHandler(IAdminPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<bool>> Handle(UpdateAdminPlaceCommand request, CancellationToken ct)
    {
        if (request.Input.Name != null && string.IsNullOrWhiteSpace(request.Input.Name))
        {
            return Result<bool>.Failure("Tên địa điểm không được để trống.");
        }

        if (request.Input.Address != null && string.IsNullOrWhiteSpace(request.Input.Address))
        {
            return Result<bool>.Failure("Địa chỉ địa điểm không được để trống.");
        }

        var success = await _placeRepository.UpdateAdminPlaceAsync(request.Id, request.Input, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy địa điểm yêu cầu cập nhật.");
        }

        return Result<bool>.Success(true, "Cập nhật thông tin địa điểm thành công.");
    }
}
