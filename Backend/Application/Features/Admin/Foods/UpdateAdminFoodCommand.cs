using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Foods;

public record UpdateAdminFoodCommand(
    long Id, 
    UpdateAdminFoodInput Input, 
    FileUploadModel? ImageFile = null) : IRequest<Result<AdminFoodUpdatedResultDto>>;

public class UpdateAdminFoodCommandHandler : IRequestHandler<UpdateAdminFoodCommand, Result<AdminFoodUpdatedResultDto>>
{
    private readonly IAdminFoodRepository _foodRepository;
    private readonly IBlobService _blobService;

    public UpdateAdminFoodCommandHandler(
        IAdminFoodRepository foodRepository,
        IBlobService blobService)
    {
        _foodRepository = foodRepository;
        _blobService = blobService;
    }

    public async Task<Result<AdminFoodUpdatedResultDto>> Handle(UpdateAdminFoodCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Name))
        {
            return Result<AdminFoodUpdatedResultDto>.Failure("Tên món ăn không được để trống.");
        }

        // 1. Tải lên tệp ảnh qua multipart/form-data trực tiếp lên Azure Blob
        if (request.ImageFile != null && request.ImageFile.Content != null && request.ImageFile.Content.Length > 0)
        {
            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (request.ImageFile.Content.Length > maxFileSize)
            {
                return Result<AdminFoodUpdatedResultDto>.Failure("Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB).");
            }

            var ext = Path.GetExtension(request.ImageFile.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(ext))
            {
                return Result<AdminFoodUpdatedResultDto>.Failure($"Định dạng tệp '{ext}' không được hỗ trợ. Chỉ chấp nhận .jpg, .jpeg, .png, .webp.");
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
                return Result<AdminFoodUpdatedResultDto>.Failure($"Lỗi khi tải ảnh món ăn lên máy chủ Azure Blob: {ex.Message}");
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
                return Result<AdminFoodUpdatedResultDto>.Failure($"Lỗi khi tải ảnh món ăn Base64 lên máy chủ Azure Blob: {ex.Message}");
            }
        }

        var success = await _foodRepository.UpdateAdminFoodAsync(request.Id, request.Input, ct);
        if (!success)
        {
            return Result<AdminFoodUpdatedResultDto>.NotFound("Không tìm thấy món ăn yêu cầu cập nhật hoặc bạn không có quyền chỉnh sửa.");
        }

        var resultDto = new AdminFoodUpdatedResultDto
        {
            Id = request.Id,
            CoverImg = request.Input.CoverImg,
            Success = true
        };

        return Result<AdminFoodUpdatedResultDto>.Success(resultDto, "Cập nhật món ăn thành công.");
    }
}

