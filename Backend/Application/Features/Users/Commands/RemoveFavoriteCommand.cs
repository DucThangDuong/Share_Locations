using Application.Common;
using Application.Common.Interfaces;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Users.Commands;

public record RemoveFavoriteCommand(long UserId, int TargetType, long TargetId) : IRequest<Result>;

public class RemoveFavoriteCommandHandler : IRequestHandler<RemoveFavoriteCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRecommendationService? _recommendationService;

    public RemoveFavoriteCommandHandler(IUnitOfWork unitOfWork, IRecommendationService? recommendationService = null)
    {
        _unitOfWork = unitOfWork;
        _recommendationService = recommendationService;
    }

    public async Task<Result> Handle(RemoveFavoriteCommand request, CancellationToken ct)
    {
        var existing = await _unitOfWork.Favorites.GetAsync(
            request.UserId,
            request.TargetId,
            (FavoriteTargetType)request.TargetType,
            ct);

        if (existing != null)
        {
            _unitOfWork.Favorites.Remove(existing);
            await _unitOfWork.SaveChangesAsync(ct);

            if (_recommendationService != null)
            {
                await _recommendationService.InvalidateUserVectorCacheAsync(request.UserId, ct);
            }
        }

        return Result.Success("Đã bỏ lưu thành công.");
    }
}
