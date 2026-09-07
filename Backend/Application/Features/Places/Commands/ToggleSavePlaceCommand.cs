using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Places.Commands;

public record ToggleSavePlaceCommand(
    long PlaceId,
    long UserId,
    bool Save) : IRequest<Result<ToggleSavePlaceDto>>;

public class ToggleSavePlaceCommandHandler : IRequestHandler<ToggleSavePlaceCommand, Result<ToggleSavePlaceDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ToggleSavePlaceCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ToggleSavePlaceDto>> Handle(ToggleSavePlaceCommand request, CancellationToken ct)
    {
        var place = await _unitOfWork.Places.GetByIdAsync(request.PlaceId, ct);
        if (place == null)
        {
            return Result<ToggleSavePlaceDto>.NotFound("Địa điểm không tồn tại.");
        }

        var existing = await _unitOfWork.Favorites.GetAsync(request.UserId, request.PlaceId, FavoriteTargetType.Place, ct);

        if (request.Save)
        {
            if (existing == null)
            {
                var favorite = new Favorite(request.UserId, request.PlaceId, FavoriteTargetType.Place);
                await _unitOfWork.Favorites.AddAsync(favorite, ct);
                await _unitOfWork.SaveChangesAsync(ct);
            }
        }
        else
        {
            if (existing != null)
            {
                _unitOfWork.Favorites.Remove(existing);
                await _unitOfWork.SaveChangesAsync(ct);
            }
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
