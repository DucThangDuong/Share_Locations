using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Users.Commands;

public record AddFavoriteCommand(long UserId, int TargetType, long TargetId) : IRequest<Result<AddFavoriteResponseDto>>;

public class AddFavoriteCommandHandler : IRequestHandler<AddFavoriteCommand, Result<AddFavoriteResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddFavoriteCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<AddFavoriteResponseDto>> Handle(AddFavoriteCommand request, CancellationToken ct)
    {
        if (!Enum.IsDefined(typeof(FavoriteTargetType), (byte)request.TargetType))
        {
            return Result<AddFavoriteResponseDto>.Failure(
                "Loại mục yêu thích không hợp lệ (1: Địa điểm, 2: Ẩm thực, 3: Lịch trình, 4: Bài viết).");
        }

        var targetType = (FavoriteTargetType)request.TargetType;

        var existing = await _unitOfWork.Favorites.GetAsync(
            request.UserId,
            request.TargetId,
            targetType,
            ct);

        if (existing == null)
        {
            var favorite = new Favorite(request.UserId, request.TargetId, targetType);
            await _unitOfWork.Favorites.AddAsync(favorite, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }

        var response = new AddFavoriteResponseDto
        {
            IsSaved = true,
            TargetType = request.TargetType,
            TargetId = request.TargetId
        };

        return Result<AddFavoriteResponseDto>.Created(response, "Đã thêm vào danh sách yêu thích thành công.");
    }
}
