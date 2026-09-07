using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Itineraries.Commands;

public record SaveItineraryCommand(long TripId, long UserId) : IRequest<Result<SaveItineraryResponseDto>>;

public class SaveItineraryCommandHandler : IRequestHandler<SaveItineraryCommand, Result<SaveItineraryResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public SaveItineraryCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<SaveItineraryResponseDto>> Handle(SaveItineraryCommand request, CancellationToken ct)
    {
        var existing = await _unitOfWork.Favorites.GetAsync(request.UserId, request.TripId, FavoriteTargetType.Trip, ct);
        if (existing == null)
        {
            var favorite = new Favorite(request.UserId, request.TripId, FavoriteTargetType.Trip);
            await _unitOfWork.Favorites.AddAsync(favorite, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }

        var response = new SaveItineraryResponseDto
        {
            Saved = true,
            ItineraryId = request.TripId
        };

        return Result<SaveItineraryResponseDto>.Success(response, "Đã lưu lịch trình thành công.");
    }
}
