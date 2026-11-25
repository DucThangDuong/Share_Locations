using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Trips.Commands;

public record PublishTripCommand(
    long TripId,
    long UserId,
    PublishTripRequestDto Dto,
    FileUploadModel? CoverImageFile = null) : IRequest<Result>;

public class PublishTripCommandHandler : IRequestHandler<PublishTripCommand, Result>
{
    private static readonly HashSet<string> DefaultDraftTitles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Chuyến đi mới của tôi",
        "Chuyến đi của tôi"
    };

    private static readonly HashSet<string> DefaultDraftDescriptions = new(StringComparer.OrdinalIgnoreCase)
    {
        "Lên kế hoạch chuyến đi mới",
        "Lên kế hoạch và lưu lại các địa điểm yêu thích."
    };

    private readonly IUnitOfWork _unitOfWork;
    private readonly IBlobService _blobService;
    private readonly IReputationService? _reputationService;

    public PublishTripCommandHandler(
        IUnitOfWork unitOfWork,
        IBlobService blobService,
        IReputationService? reputationService = null)
    {
        _unitOfWork = unitOfWork;
        _blobService = blobService;
        _reputationService = reputationService;
    }

    public async Task<Result> Handle(PublishTripCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdWithDetailsAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        if (trip.UserId != request.UserId)
        {
            return Result.Forbidden("Chỉ có chủ sở hữu (Trưởng đoàn) mới có quyền xuất bản chuyến đi này.");
        }

        var validStops = trip.Days
            .SelectMany(d => d.Places)
            .Where(p => p.Place != null && !p.Place.IsDeleted)
            .ToList();

        if (validStops.Count == 0)
        {
            return Result.Failure("Chuyến đi phải có ít nhất 1 địa điểm tham quan trước khi công bố.");
        }

        var dto = request.Dto;
        var newTitle = dto.Title != null ? dto.Title.Trim() : (trip.Title?.Trim() ?? string.Empty);

        if (string.IsNullOrWhiteSpace(newTitle) || newTitle.Length < 3 || DefaultDraftTitles.Contains(newTitle))
        {
            return Result.Failure("Vui lòng đặt tên cụ thể cho chuyến đi trước khi công bố.");
        }

        var newDescription = dto.Description?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(newDescription) || newDescription.Length < 10 || DefaultDraftDescriptions.Contains(newDescription))
        {
            return Result.Failure("Mô tả chuyến đi là bắt buộc (tối thiểu 10 ký tự) trước khi công bố.");
        }

        var existingCover = trip.CoverImageUrl?.Trim();
        var hasUploadFile = request.CoverImageFile != null && request.CoverImageFile.Content.Length > 0;

        if (!hasUploadFile && string.IsNullOrWhiteSpace(existingCover))
        {
            return Result.Failure("Ảnh bìa chuyến đi là bắt buộc khi công bố.");
        }

        string? newCoverImage = existingCover;
        if (hasUploadFile && request.CoverImageFile != null)
        {
            newCoverImage = await _blobService.UploadImageAsync(
                request.CoverImageFile.Content,
                request.CoverImageFile.FileName,
                request.CoverImageFile.ContentType,
                "covers",
                ct);
        }

        if (string.IsNullOrWhiteSpace(newCoverImage))
        {
            return Result.Failure("Ảnh bìa chuyến đi là bắt buộc khi công bố.");
        }

        trip.UpdateInfo(newTitle, newDescription, newCoverImage);

        var stopsTotalCost = validStops.Sum(p => p.EstimatedCost ?? 0m);
        if ((!trip.EstimatedBudget.HasValue || trip.EstimatedBudget.Value <= 0) && stopsTotalCost > 0)
        {
            trip.UpdateBudget(stopsTotalCost);
        }

        trip.ChangePrivacy(TripPrivacy.Public);

        await _unitOfWork.SaveChangesAsync(ct);

        if (_reputationService != null)
        {
            await _reputationService.AwardPointsAsync(
                request.UserId,
                ReputationActionType.TripCreated,
                trip.Id,
                $"Xuất bản lịch trình du lịch '{trip.Title}'",
                ct);
        }

        return Result.Success("Xuất bản chuyến đi thành công. Lịch trình của bạn hiện đã được công khai trên nền tảng!");
    }
}
