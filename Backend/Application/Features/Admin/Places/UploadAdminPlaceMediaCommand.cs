using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Places;

public record UploadAdminPlaceMediaCommand(
    long PlaceId,
    List<FileUploadModel> Files,
    long? UploaderId = null) : IRequest<Result<List<PlaceMediaItemDto>>>;

public class UploadAdminPlaceMediaCommandHandler : IRequestHandler<UploadAdminPlaceMediaCommand, Result<List<PlaceMediaItemDto>>>
{
    private readonly IAdminPlaceRepository _placeRepository;
    private readonly IBlobService _blobService;

    public UploadAdminPlaceMediaCommandHandler(
        IAdminPlaceRepository placeRepository,
        IBlobService blobService)
    {
        _placeRepository = placeRepository;
        _blobService = blobService;
    }

    public async Task<Result<List<PlaceMediaItemDto>>> Handle(UploadAdminPlaceMediaCommand request, CancellationToken ct)
    {
        if (request.Files == null || request.Files.Count == 0)
        {
            return Result<List<PlaceMediaItemDto>>.Failure("Vui lòng chọn ít nhất một hình ảnh.");
        }

        const long maxFileSize = 10 * 1024 * 1024; // 10MB
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var uploadedUrls = new List<string>();

        try
        {
            foreach (var file in request.Files)
            {
                if (file.Content == null || file.Content.Length == 0) continue;

                if (file.Content.Length > maxFileSize)
                {
                    return Result<List<PlaceMediaItemDto>>.Failure($"Tệp '{file.FileName}' vượt quá dung lượng cho phép 10MB.");
                }

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(ext))
                {
                    return Result<List<PlaceMediaItemDto>>.Failure($"Tệp '{file.FileName}' có định dạng không được hỗ trợ.");
                }

                var url = await _blobService.UploadImageAsync(
                    file.Content,
                    file.FileName,
                    file.ContentType,
                    "places",
                    ct);

                uploadedUrls.Add(url);
            }

            if (uploadedUrls.Count == 0)
            {
                return Result<List<PlaceMediaItemDto>>.Failure("Không có tệp hình ảnh hợp lệ để tải lên.");
            }

            var items = await _placeRepository.AddPlaceMediaAsync(request.PlaceId, uploadedUrls, request.UploaderId, ct);
            if (items == null || items.Count == 0)
            {
                // Xóa các blob vừa upload nếu không lưu được vào db do quyền hạn hoặc place không tồn tại
                foreach (var url in uploadedUrls)
                {
                    await _blobService.DeleteImageAsync(url, "places", ct);
                }
                return Result<List<PlaceMediaItemDto>>.NotFound("Không tìm thấy địa điểm hoặc bạn không có quyền quản lý địa điểm này.");
            }

            return Result<List<PlaceMediaItemDto>>.Success(items, "Tải ảnh lên bộ sưu tập địa điểm thành công.");
        }
        catch (Exception ex)
        {
            return Result<List<PlaceMediaItemDto>>.Failure($"Lỗi khi tải ảnh lên bộ sưu tập: {ex.Message}");
        }
    }
}
