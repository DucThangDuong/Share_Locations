using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Admin.Places;

public record UpdateAdminPlaceCoverImageCommand(long PlaceId, FileUploadModel File) : IRequest<Result<string>>;

public class UpdateAdminPlaceCoverImageCommandHandler : IRequestHandler<UpdateAdminPlaceCoverImageCommand, Result<string>>
{
    private readonly IAdminPlaceRepository _placeRepository;
    private readonly IBlobService _blobService;

    public UpdateAdminPlaceCoverImageCommandHandler(
        IAdminPlaceRepository placeRepository,
        IBlobService blobService)
    {
        _placeRepository = placeRepository;
        _blobService = blobService;
    }

    public async Task<Result<string>> Handle(UpdateAdminPlaceCoverImageCommand request, CancellationToken ct)
    {
        if (request.File == null || request.File.Content == null || request.File.Content.Length == 0)
        {
            return Result<string>.Failure("Tệp ảnh không hợp lệ hoặc rỗng.");
        }

        const long maxFileSize = 10 * 1024 * 1024; // 10MB
        if (request.File.Content.Length > maxFileSize)
        {
            return Result<string>.Failure("Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB).");
        }

        var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowedExtensions.Contains(ext))
        {
            return Result<string>.Failure($"Định dạng tệp '{ext}' không được hỗ trợ. Chỉ chấp nhận .jpg, .jpeg, .png, .webp.");
        }

        // Upload trực tiếp lên Azure Blob Storage (container 'places')
        string newImageUrl;
        try
        {
            newImageUrl = await _blobService.UploadImageAsync(
                request.File.Content,
                request.File.FileName,
                request.File.ContentType,
                "places",
                ct);
        }
        catch (Exception ex)
        {
            return Result<string>.Failure($"Lỗi khi tải ảnh lên máy chủ lưu trữ Azure: {ex.Message}");
        }

        // Cập nhật đường link nguyên vẹn vào DB và kiểm tra scoping quyền hạn của Admin
        var (success, oldCoverUrl) = await _placeRepository.UpdateCoverImageAsync(request.PlaceId, newImageUrl, ct);
        if (!success)
        {
            // Nếu không có quyền hoặc không tìm thấy địa điểm, dọn dẹp blob vừa tạo
            await _blobService.DeleteImageAsync(newImageUrl, "places", ct);
            return Result<string>.NotFound("Không tìm thấy địa điểm hoặc bạn không có quyền quản lý địa điểm này.");
        }

        // Tự động dọn dẹp ảnh cũ trên Azure Blob nếu có để tiết kiệm dung lượng
        if (!string.IsNullOrWhiteSpace(oldCoverUrl) && oldCoverUrl.Contains(".blob.core.windows.net/"))
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _blobService.DeleteImageAsync(oldCoverUrl, "places", CancellationToken.None);
                }
                catch
                {
                    // Ignore background cleanup failure
                }
            }, CancellationToken.None);
        }

        return Result<string>.Success(newImageUrl, "Cập nhật ảnh đại diện địa điểm thành công.");
    }
}
