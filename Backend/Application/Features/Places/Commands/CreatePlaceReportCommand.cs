using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Places.Commands;

public record CreatePlaceReportCommand(
    long PlaceId,
    string Reason,
    string? Description = null,
    string? ContactEmail = null,
    long? ReporterId = null) : IRequest<Result<bool>>;

public class CreatePlaceReportCommandHandler : IRequestHandler<CreatePlaceReportCommand, Result<bool>>
{
    private readonly IPlaceRepository _placeRepository;

    public CreatePlaceReportCommandHandler(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<bool>> Handle(CreatePlaceReportCommand request, CancellationToken ct)
    {
        var success = await _placeRepository.CreatePlaceReportAsync(
            request.PlaceId,
            request.Reason,
            request.Description,
            request.ContactEmail,
            request.ReporterId,
            ct);

        if (!success)
        {
            return Result<bool>.Failure("Không thể gửi báo cáo vào lúc này. Vui lòng thử lại sau.");
        }

        return Result<bool>.Success(true, "Cảm ơn bạn đã đóng góp thông tin. Báo cáo của bạn đang được xem xét.");
    }
}
