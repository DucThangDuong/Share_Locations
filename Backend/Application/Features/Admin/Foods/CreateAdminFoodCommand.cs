using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Foods;

public record CreateAdminFoodCommand(
    CreateAdminFoodInput Input, 
    FileUploadModel? ImageFile = null) : IRequest<Result<long>>;

public class CreateAdminFoodCommandHandler : IRequestHandler<CreateAdminFoodCommand, Result<long>>
{
    private readonly IAdminFoodRepository _foodRepository;
    private readonly IBlobService _blobService;

    public CreateAdminFoodCommandHandler(
        IAdminFoodRepository foodRepository,
        IBlobService blobService)
    {
        _foodRepository = foodRepository;
        _blobService = blobService;
    }

    public async Task<Result<long>> Handle(CreateAdminFoodCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Name))
        {
            return Result<long>.Failure("Tên món ăn không được để trống.");
        }

        // 1. Tải lên tệp ảnh qua multipart/form-data trực tiếp lên Azure Blob
        if (request.ImageFile != null && request.ImageFile.Content != null && request.ImageFile.Content.Length > 0)
        {
            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (request.ImageFile.Content.Length > maxFileSize)
            {
                return Result<long>.Failure("Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB).");
            }

            var ext = Path.GetExtension(request.ImageFile.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(ext))
            {
                return Result<long>.Failure($"Định dạng tệp '{ext}' không được hỗ trợ. Chỉ chấp nhận .jpg, .jpeg, .png, .webp.");
            }

            try
            {
                var uploadedUrl = await _blobService.UploadImageAsync(
                    request.ImageFile.Content,
                    request.ImageFile.FileName,
                    request.ImageFile.ContentType,
                    "foods",
                    ct);

                request.Input.CoverImg = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<long>.Failure($"Lỗi khi tải ảnh món ăn lên máy chủ Azure Blob: {ex.Message}");
            }
        }
        // 2. Tải lên ảnh Base64 lên Azure Blob nếu gửi qua JSON
        else if (!string.IsNullOrWhiteSpace(request.Input.CoverImg) && 
                 request.Input.CoverImg.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uploadedUrl = await _blobService.UploadBase64ImageAsync(
                    request.Input.CoverImg,
                    "foods",
                    ct);

                request.Input.CoverImg = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<long>.Failure($"Lỗi khi tải ảnh món ăn Base64 lên máy chủ Azure Blob: {ex.Message}");
            }
        }

        var id = await _foodRepository.CreateAdminFoodAsync(request.Input, ct);
        return Result<long>.Created(id, "Tạo mới món ăn đặc sản thành công.");
    }
}

