using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Commands;

public record ToggleSavePlaceCommand(
    long PlaceId,
    long UserId,
    bool Save) : IRequest<Result<ToggleSavePlaceDto>>;

public class ToggleSavePlaceCommandHandler : IRequestHandler<ToggleSavePlaceCommand, Result<ToggleSavePlaceDto>>
{
    private readonly IPlaceRepository _placeRepository;

    public ToggleSavePlaceCommandHandler(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<ToggleSavePlaceDto>> Handle(ToggleSavePlaceCommand request, CancellationToken ct)
    {
        var success = await _placeRepository.ToggleSavePlaceAsync(request.UserId, request.PlaceId, request.Save, ct);

        if (!success)
        {
            return Result<ToggleSavePlaceDto>.Failure("Không thể cập nhật danh sách lưu địa điểm.");
        }

        var response = new ToggleSavePlaceDto
        {
            IsSaved = request.Save,
            PlaceId = request.PlaceId
        };

        var message = request.Save
            ? "Đã lưu địa điểm vào bộ sưu tập cá nhân."
            : "Đã xóa địa điểm khỏi bộ sưu tập cá nhân.";

        return Result<ToggleSavePlaceDto>.Success(response, message);
    }
}
