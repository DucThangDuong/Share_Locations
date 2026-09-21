using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Places;

public record DeleteAdminPlaceCommand(long Id) : IRequest<Result<bool>>;

public class DeleteAdminPlaceCommandHandler : IRequestHandler<DeleteAdminPlaceCommand, Result<bool>>
{
    private readonly IAdminPlaceRepository _placeRepository;

    public DeleteAdminPlaceCommandHandler(IAdminPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<bool>> Handle(DeleteAdminPlaceCommand request, CancellationToken ct)
    {
        var success = await _placeRepository.DeleteAdminPlaceAsync(request.Id, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy địa điểm yêu cầu xóa.");
        }

        return Result<bool>.Success(true, "Xóa địa điểm thành công.");
    }
}
