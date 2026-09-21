using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Foods;

public record UpdateAdminFoodStatusCommand(long Id, string Status) : IRequest<Result<bool>>;

public class UpdateAdminFoodStatusCommandHandler : IRequestHandler<UpdateAdminFoodStatusCommand, Result<bool>>
{
    private readonly IAdminFoodRepository _foodRepository;

    public UpdateAdminFoodStatusCommandHandler(IAdminFoodRepository foodRepository)
    {
        _foodRepository = foodRepository;
    }

    public async Task<Result<bool>> Handle(UpdateAdminFoodStatusCommand request, CancellationToken ct)
    {
        var success = await _foodRepository.UpdateAdminFoodStatusAsync(request.Id, request.Status, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy món ăn yêu cầu.");
        }

        return Result<bool>.Success(true, "Cập nhật trạng thái món ăn thành công.");
    }
}
