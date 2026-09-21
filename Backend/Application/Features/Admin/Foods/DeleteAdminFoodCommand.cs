using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Foods;

public record DeleteAdminFoodCommand(long Id) : IRequest<Result<bool>>;

public class DeleteAdminFoodCommandHandler : IRequestHandler<DeleteAdminFoodCommand, Result<bool>>
{
    private readonly IAdminFoodRepository _foodRepository;

    public DeleteAdminFoodCommandHandler(IAdminFoodRepository foodRepository)
    {
        _foodRepository = foodRepository;
    }

    public async Task<Result<bool>> Handle(DeleteAdminFoodCommand request, CancellationToken ct)
    {
        var success = await _foodRepository.DeleteAdminFoodAsync(request.Id, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy món ăn yêu cầu xóa.");
        }

        return Result<bool>.Success(true, "Xóa món ăn thành công.");
    }
}
