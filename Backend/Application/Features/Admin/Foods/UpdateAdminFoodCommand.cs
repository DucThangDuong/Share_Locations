using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Foods;

public record UpdateAdminFoodCommand(long Id, UpdateAdminFoodInput Input) : IRequest<Result<bool>>;

public class UpdateAdminFoodCommandHandler : IRequestHandler<UpdateAdminFoodCommand, Result<bool>>
{
    private readonly IAdminFoodRepository _foodRepository;

    public UpdateAdminFoodCommandHandler(IAdminFoodRepository foodRepository)
    {
        _foodRepository = foodRepository;
    }

    public async Task<Result<bool>> Handle(UpdateAdminFoodCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Name))
        {
            return Result<bool>.Failure("Tên món ăn không được để trống.");
        }

        var success = await _foodRepository.UpdateAdminFoodAsync(request.Id, request.Input, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy món ăn yêu cầu cập nhật.");
        }

        return Result<bool>.Success(true, "Cập nhật món ăn thành công.");
    }
}
