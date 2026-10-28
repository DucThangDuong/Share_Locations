using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.DTOs.Admin;
using Application.Features.Admin.Catalog;
using MediatR;

namespace Application.Features.Admin.Places;

public record CreateAdminPlaceCommand(
    CreateAdminPlaceInput Input,
    long? CreatorId,
    FileUploadModel? CoverImageFile = null,
    IReadOnlyList<FileUploadModel>? MediaFiles = null
) : IRequest<Result<long>>;

public class CreateAdminPlaceCommandHandler : IRequestHandler<CreateAdminPlaceCommand, Result<long>>
{
    private readonly IAdminPlaceRepository _placeRepository;
    private readonly ICacheService _cacheService;
    private readonly IBlobService _blobService;

    public CreateAdminPlaceCommandHandler(
        IAdminPlaceRepository placeRepository,
        ICacheService cacheService,
        IBlobService blobService)
    {
        _placeRepository = placeRepository;
        _cacheService = cacheService;
        _blobService = blobService;
    }

    public async Task<Result<long>> Handle(CreateAdminPlaceCommand request, CancellationToken ct)
    {
        var input = request.Input;
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            return Result<long>.Failure("Tên địa điểm không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(input.Address))
        {
            return Result<long>.Failure("Địa chỉ địa điểm không được để trống.");
        }

        if (input.ProvinceId <= 0)
        {
            return Result<long>.Failure("Vui lòng chọn Tỉnh/Thành phố hợp lệ.");
        }

        if (input.CategoryId <= 0)
        {
            return Result<long>.Failure("Vui lòng chọn Danh mục hợp lệ.");
        }

        // Guard against regional culture parsing bugs (e.g. 21034508 instead of 21.034508)
        if (input.Latitude.HasValue && (input.Latitude.Value > 90m || input.Latitude.Value < -90m))
        {
            var str = input.Latitude.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
            if (str.Length >= 3 && decimal.TryParse(str.Insert(2, "."), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var fixedLat) && fixedLat <= 90m && fixedLat >= -90m)
            {
                input.Latitude = fixedLat;
            }
            else
            {
                input.Latitude = null;
            }
        }

        if (input.Longitude.HasValue && (input.Longitude.Value > 180m || input.Longitude.Value < -180m))
        {
            var str = input.Longitude.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
            if (str.Length >= 4 && decimal.TryParse(str.Insert(3, "."), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var fixedLng) && fixedLng <= 180m && fixedLng >= -180m)
            {
                input.Longitude = fixedLng;
            }
            else
            {
                input.Longitude = null;
            }
        }

        var uploadCache = new Dictionary<string, string>(StringComparer.Ordinal);

        // 1. Upload Cover Image File nếu có
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
                input.PrimaryImageUrl = uploadedCoverUrl;
                uploadCache[$"{request.CoverImageFile.FileName}_{request.CoverImageFile.Content.Length}"] = uploadedCoverUrl;
            }
            catch (Exception ex)
            {
                return Result<long>.Failure($"Lỗi khi tải ảnh bìa lên Azure: {ex.Message}");
            }
        }
        // Hoặc xử lý Base64 Cover Image
        else if (!string.IsNullOrWhiteSpace(input.PrimaryImageUrl))
        {
            if (input.PrimaryImageUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) ||
                (!input.PrimaryImageUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !input.PrimaryImageUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    var uploadedCoverUrl = await _blobService.UploadBase64ImageAsync(input.PrimaryImageUrl, "places", ct);
                    uploadCache[input.PrimaryImageUrl] = uploadedCoverUrl;
                    input.PrimaryImageUrl = uploadedCoverUrl;
                }
                catch (Exception ex)
                {
                    return Result<long>.Failure($"Lỗi khi tải ảnh bìa Base64 lên Azure: {ex.Message}");
                }
            }
        }

        // 2. Upload Media Files nếu có
        var finalPhotos = new List<string>();
        if (request.MediaFiles != null && request.MediaFiles.Count > 0)
        {
            foreach (var mf in request.MediaFiles)
            {
                if (mf.Content == null || mf.Content.Length == 0) continue;
                string key = $"{mf.FileName}_{mf.Content.Length}";
                if (uploadCache.TryGetValue(key, out var cached))
                {
                    if (!finalPhotos.Contains(cached)) finalPhotos.Add(cached);
                    continue;
                }

                try
                {
                    var uploadedUrl = await _blobService.UploadImageAsync(mf.Content, mf.FileName, mf.ContentType, "places", ct);
                    uploadCache[key] = uploadedUrl;
                    if (!finalPhotos.Contains(uploadedUrl)) finalPhotos.Add(uploadedUrl);
                }
                catch (Exception ex)
                {
                    return Result<long>.Failure($"Lỗi khi tải ảnh đính kèm lên Azure: {ex.Message}");
                }
            }
        }

        // 3. Xử lý ảnh trong input.Photos / input.Images (Base64 hoặc URL)
        var rawPhotos = new List<string>();
        if (input.Photos != null) rawPhotos.AddRange(input.Photos);
        if (input.Images != null) rawPhotos.AddRange(input.Images);

        foreach (var p in rawPhotos.Where(s => !string.IsNullOrWhiteSpace(s)).Distinct())
        {
            if (uploadCache.TryGetValue(p, out var cached))
            {
                if (!finalPhotos.Contains(cached)) finalPhotos.Add(cached);
                continue;
            }

            if (p.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase) ||
                (!p.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !p.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    var uploadedUrl = await _blobService.UploadBase64ImageAsync(p, "places", ct);
                    uploadCache[p] = uploadedUrl;
                    if (!finalPhotos.Contains(uploadedUrl)) finalPhotos.Add(uploadedUrl);
                }
                catch (Exception ex)
                {
                    return Result<long>.Failure($"Lỗi khi tải ảnh Base64 lên Azure: {ex.Message}");
                }
            }
            else
            {
                uploadCache[p] = p;
                if (!finalPhotos.Contains(p)) finalPhotos.Add(p);
            }
        }

        // Đồng bộ ảnh bìa và danh sách ảnh phụ
        if (string.IsNullOrWhiteSpace(input.PrimaryImageUrl) && finalPhotos.Count > 0)
        {
            input.PrimaryImageUrl = finalPhotos[0];
        }
        if (!string.IsNullOrWhiteSpace(input.PrimaryImageUrl) && finalPhotos.Count == 0)
        {
            finalPhotos.Add(input.PrimaryImageUrl);
        }

        input.Photos = finalPhotos;

        var id = await _placeRepository.CreateAdminPlaceAsync(input, request.CreatorId, ct);
        await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
        return Result<long>.Created(id, "Tạo mới địa điểm thành công.");
    }
}
