using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Foods;

public record CreateAdminFoodCommand(CreateAdminFoodInput Input) : IRequest<Result<long>>;

public class CreateAdminFoodCommandHandler : IRequestHandler<CreateAdminFoodCommand, Result<long>>
{
    private readonly IAdminFoodRepository _foodRepository;

    public CreateAdminFoodCommandHandler(IAdminFoodRepository foodRepository)
    {
        _foodRepository = foodRepository;
    }

    public async Task<Result<long>> Handle(CreateAdminFoodCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Name))
        {
            return Result<long>.Failure("Tên món ăn không được để trống.");
        }

        var id = await _foodRepository.CreateAdminFoodAsync(request.Input, ct);
        return Result<long>.Created(id, "Tạo mới món ăn đặc sản thành công.");
    }
}
