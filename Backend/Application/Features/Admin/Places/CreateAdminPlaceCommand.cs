using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Places;

public record CreateAdminPlaceCommand(CreateAdminPlaceInput Input, long? CreatorId) : IRequest<Result<long>>;

public class CreateAdminPlaceCommandHandler : IRequestHandler<CreateAdminPlaceCommand, Result<long>>
{
    private readonly IAdminPlaceRepository _placeRepository;

    public CreateAdminPlaceCommandHandler(IAdminPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<long>> Handle(CreateAdminPlaceCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Name))
        {
            return Result<long>.Failure("Tên địa điểm không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(request.Input.Address))
        {
            return Result<long>.Failure("Địa chỉ địa điểm không được để trống.");
        }

        if (request.Input.ProvinceId <= 0)
        {
            return Result<long>.Failure("Vui lòng chọn Tỉnh/Thành phố hợp lệ.");
        }

        if (request.Input.CategoryId <= 0)
        {
            return Result<long>.Failure("Vui lòng chọn Danh mục hợp lệ.");
        }

        var id = await _placeRepository.CreateAdminPlaceAsync(request.Input, request.CreatorId, ct);
        return Result<long>.Created(id, "Tạo mới địa điểm thành công.");
    }
}
