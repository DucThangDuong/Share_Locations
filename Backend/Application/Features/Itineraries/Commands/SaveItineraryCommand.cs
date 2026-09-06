using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Itineraries.Commands;

public record SaveItineraryCommand(long TripId, long UserId) : IRequest<Result<SaveItineraryResponseDto>>;

public class SaveItineraryCommandHandler : IRequestHandler<SaveItineraryCommand, Result<SaveItineraryResponseDto>>
{
    private readonly ITripRepository _tripRepository;

    public SaveItineraryCommandHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<SaveItineraryResponseDto>> Handle(SaveItineraryCommand request, CancellationToken ct)
    {
        var saved = await _tripRepository.SaveItineraryAsync(request.UserId, request.TripId, ct);
        if (!saved)
        {
            return Result<SaveItineraryResponseDto>.Failure("Không thể lưu lịch trình vào bộ sưu tập cá nhân.");
        }

        var response = new SaveItineraryResponseDto
        {
            Saved = true,
            ItineraryId = request.TripId
        };

        return Result<SaveItineraryResponseDto>.Success(response, "Đã lưu lịch trình thành công.");
    }
}
