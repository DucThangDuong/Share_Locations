using System.Text.Json;
using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Proposals.Commands;

public record CreateProposalCommand(
    long UserId,
    CreateProposalRequestDto Dto,
    FileUploadModel? CoverImageFile = null,
    IReadOnlyList<FileUploadModel>? MediaFiles = null
) : IRequest<Result<UserProposalItemDto>>;

public class CreateProposalCommandHandler : IRequestHandler<CreateProposalCommand, Result<UserProposalItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBlobService _blobService;

    public CreateProposalCommandHandler(IUnitOfWork unitOfWork, IBlobService blobService)
    {
        _unitOfWork = unitOfWork;
        _blobService = blobService;
    }

    public async Task<Result<UserProposalItemDto>> Handle(CreateProposalCommand request, CancellationToken ct)
    {
        var dto = request.Dto;
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return Result<UserProposalItemDto>.Failure("Tên địa điểm không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(dto.Address))
        {
            return Result<UserProposalItemDto>.Failure("Địa chỉ không được để trống.");
        }

        if (dto.CategoryId <= 0)
        {
            return Result<UserProposalItemDto>.Failure("Vui lòng chọn danh mục hợp lệ cho địa điểm.");
        }

        if (dto.ProvinceId <= 0)
        {
            return Result<UserProposalItemDto>.Failure("Vui lòng chọn tỉnh/thành phố hợp lệ cho địa điểm.");
        }

        var mediaUrls = dto.MediaUrls ?? new List<string>();
        if (mediaUrls.Count == 0 && dto.Images != null && dto.Images.Count > 0)
        {
            mediaUrls = new List<string>(dto.Images);
        }
        dto.MediaUrls = mediaUrls;

        var uploadCache = new Dictionary<string, string>(StringComparer.Ordinal);

        // 1. Xử lý ảnh bìa nếu được upload dưới dạng file (multipart/form-data)
        if (request.CoverImageFile != null && request.CoverImageFile.Content != null && request.CoverImageFile.Content.Length > 0)
        {
            try
            {
                var uploadedCoverUrl = await _blobService.UploadImageAsync(
                    request.CoverImageFile.Content,
                    request.CoverImageFile.FileName,
                    request.CoverImageFile.ContentType,
                    "places",
                    ct);
                dto.CoverImg = uploadedCoverUrl;
                string fileKey = $"{request.CoverImageFile.FileName}_{request.CoverImageFile.Content.Length}";
                uploadCache[fileKey] = uploadedCoverUrl;
            }
            catch (Exception ex)
            {
                return Result<UserProposalItemDto>.Failure($"Lỗi khi tải ảnh bìa lên Azure: {ex.Message}");
            }
        }
        // 2. Xử lý ảnh bìa nếu gửi dạng chuỗi Base64
        else if (!string.IsNullOrWhiteSpace(dto.CoverImg))
        {
            if (dto.CoverImg.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) ||
                (!dto.CoverImg.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !dto.CoverImg.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    var uploadedCoverUrl = await _blobService.UploadBase64ImageAsync(dto.CoverImg, "places", ct);
                    uploadCache[dto.CoverImg] = uploadedCoverUrl;
                    dto.CoverImg = uploadedCoverUrl;
                }
                catch (Exception ex)
                {
                    return Result<UserProposalItemDto>.Failure($"Lỗi khi xử lý ảnh bìa Base64 tải lên Azure: {ex.Message}");
                }
            }
            else
            {
                uploadCache[dto.CoverImg] = dto.CoverImg;
            }
        }

        var finalMediaUrls = new List<string>();

        // 3. Xử lý danh sách ảnh đính kèm nếu được upload dưới dạng files (multipart/form-data)
        if (request.MediaFiles != null && request.MediaFiles.Count > 0)
        {
            foreach (var mediaFile in request.MediaFiles)
            {
                if (mediaFile.Content == null || mediaFile.Content.Length == 0) continue;
                string fileKey = $"{mediaFile.FileName}_{mediaFile.Content.Length}";
                if (uploadCache.TryGetValue(fileKey, out var existingUrl))
                {
                    if (!finalMediaUrls.Contains(existingUrl)) finalMediaUrls.Add(existingUrl);
                    continue;
                }

                try
                {
                    var uploadedMediaUrl = await _blobService.UploadImageAsync(
                        mediaFile.Content,
                        mediaFile.FileName,
                        mediaFile.ContentType,
                        "places",
                        ct);
                    uploadCache[fileKey] = uploadedMediaUrl;
                    if (!finalMediaUrls.Contains(uploadedMediaUrl))
                    {
                        finalMediaUrls.Add(uploadedMediaUrl);
                    }
                }
                catch (Exception ex)
                {
                    return Result<UserProposalItemDto>.Failure($"Lỗi khi tải ảnh đính kèm lên Azure: {ex.Message}");
                }
            }
        }

        // 4. Xử lý các ảnh đính kèm trong mediaUrls & images nếu có chứa chuỗi Base64
        var rawUrls = new List<string>();
        if (dto.MediaUrls != null) rawUrls.AddRange(dto.MediaUrls);
        if (dto.Images != null) rawUrls.AddRange(dto.Images);
        var distinctRawUrls = rawUrls.Where(u => !string.IsNullOrWhiteSpace(u)).Distinct().ToList();

        foreach (var item in distinctRawUrls)
        {
            if (uploadCache.TryGetValue(item, out var cachedUrl))
            {
                if (!finalMediaUrls.Contains(cachedUrl))
                {
                    finalMediaUrls.Add(cachedUrl);
                }
                continue;
            }

            if (item.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) ||
                (!item.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !item.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    var uploadedUrl = await _blobService.UploadBase64ImageAsync(item, "places", ct);
                    uploadCache[item] = uploadedUrl;
                    if (!finalMediaUrls.Contains(uploadedUrl))
                    {
                        finalMediaUrls.Add(uploadedUrl);
                    }
                }
                catch (Exception ex)
                {
                    return Result<UserProposalItemDto>.Failure($"Lỗi khi xử lý ảnh Base64 trong danh sách tải lên Azure: {ex.Message}");
                }
            }
            else
            {
                uploadCache[item] = item;
                if (!finalMediaUrls.Contains(item))
                {
                    finalMediaUrls.Add(item);
                }
            }
        }

        // 5. YÊU CẦU BẮT BUỘC PHẢI CÓ ẢNH (ẢNH BÌA HOẶC ẢNH ĐÍNH KÈM)
        bool hasCover = !string.IsNullOrWhiteSpace(dto.CoverImg);
        bool hasMedia = finalMediaUrls.Count > 0;

        if (!hasCover && !hasMedia)
        {
            return Result<UserProposalItemDto>.Failure("Địa điểm đề xuất bắt buộc phải có ít nhất một hình ảnh (ảnh bìa hoặc ảnh đính kèm).");
        }

        // Nếu chưa có ảnh bìa nhưng có danh sách ảnh thì lấy ảnh đầu tiên làm ảnh bìa
        if (!hasCover && hasMedia)
        {
            dto.CoverImg = finalMediaUrls[0];
        }
        // Nếu có ảnh bìa mà danh sách ảnh trống thì bổ sung ảnh bìa vào danh sách
        if (hasCover && finalMediaUrls.Count == 0)
        {
            finalMediaUrls.Add(dto.CoverImg!);
        }

        dto.MediaUrls = finalMediaUrls;
        dto.Images = finalMediaUrls;

        // Lưu URI Azure Blob vào ProposedDataJSON (tuyệt đối không lưu Base64 vào DB)
        var json = JsonSerializer.Serialize(dto);
        var proposal = new Proposal(
            request.UserId,
            json,
            null,
            dto.CategoryId > 0 ? dto.CategoryId : null,
            dto.ProvinceId > 0 ? dto.ProvinceId : null,
            ProposalType.NewPlace);

        await _unitOfWork.Proposals.AddAsync(proposal, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var responseDto = new UserProposalItemDto
        {
            Id = proposal.Id,
            Name = dto.Name,
            CategoryId = dto.CategoryId > 0 ? dto.CategoryId : null,
            ProvinceId = dto.ProvinceId > 0 ? dto.ProvinceId : null,
            Address = dto.Address,
            Phone = dto.Phone,
            Website = dto.Website,
            OpeningHours = dto.OpeningHours,
            MinPrice = dto.MinPrice,
            MaxPrice = dto.MaxPrice,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Description = dto.Description,
            CoverImg = dto.CoverImg,
            MediaUrls = dto.MediaUrls,
            ProposalType = (int)proposal.ProposalType,
            TargetPlaceId = proposal.TargetPlaceId,
            Status = (int)proposal.Status,
            AdminNote = proposal.AdminNote,
            RejectReason = proposal.RejectReason,
            CreatedAt = proposal.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            UpdatedAt = proposal.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        return Result<UserProposalItemDto>.Created(
            responseDto,
            "Gửi đề xuất địa điểm thành công! Quản trị viên sẽ xét duyệt trong 24h.");
    }
}
