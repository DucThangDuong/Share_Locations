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
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBlobService _blobService;

    public PublishTripCommandHandler(IUnitOfWork unitOfWork, IBlobService blobService)
    {
        _unitOfWork = unitOfWork;
        _blobService = blobService;
    }

    public async Task<Result> Handle(PublishTripCommand request, CancellationToken ct)
    {
        var trip = await _unitOfWork.Trips.GetByIdWithDetailsAsync(request.TripId, ct);
        if (trip == null)
        {
            return Result.NotFound("Chuyến đi không tồn tại.");
        }

        // BOLA Check: Chỉ có chủ sở hữu (Owner) mới có quyền xuất bản chuyến đi
        if (trip.UserId != request.UserId)
        {
            return Result.Forbidden("Chỉ có chủ sở hữu (Trưởng đoàn) mới có quyền xuất bản chuyến đi này.");
        }

        var dto = request.Dto;

        // Bắt buộc phải có mô tả khi xuất bản chuyến đi lên cộng đồng
        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            return Result.Failure("Mô tả chuyến đi là bắt buộc khi xuất bản.");
        }

        // Xử lý ảnh bìa: Nếu người dùng tải file lên thì upload vào Azure Blob Storage
        string? newCoverImage = trip.CoverImageUrl;
        if (request.CoverImageFile != null && request.CoverImageFile.Content.Length > 0)
        {
            newCoverImage = await _blobService.UploadImageAsync(
                request.CoverImageFile.Content,
                request.CoverImageFile.FileName,
                request.CoverImageFile.ContentType,
                "covers",
                ct);
        }

        // Cập nhật thông tin chuyến đi
        var newTitle = !string.IsNullOrWhiteSpace(dto.Title) ? dto.Title.Trim() : trip.Title;
        var newDescription = dto.Description.Trim();

        trip.UpdateInfo(newTitle, newDescription, newCoverImage);

        // Chuyển quyền riêng tư sang Public (Công khai)
        trip.ChangePrivacy(TripPrivacy.Public);

        await _unitOfWork.SaveChangesAsync(ct);
        return Result.Success("Xuất bản chuyến đi thành công. Lịch trình của bạn hiện đã được công khai trên nền tảng!");
    }
}

