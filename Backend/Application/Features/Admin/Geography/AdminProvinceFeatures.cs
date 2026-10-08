using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.DTOs.Admin;
using Application.Features.Admin.Catalog;
using MediatR;

namespace Application.Features.Admin.Geography;

// === QUERIES ===

public record GetAdminProvincesQuery(
    int? RegionId,
    byte? Status,
    bool? Featured,
    string? Keyword,
    int Page = 1,
    int PageSize = 50) : IRequest<Result<PagedResult<AdminProvinceListItemDto>>>;

public class GetAdminProvincesQueryHandler : IRequestHandler<GetAdminProvincesQuery, Result<PagedResult<AdminProvinceListItemDto>>>
{
    private readonly IAdminGeographyRepository _repo;

    public GetAdminProvincesQueryHandler(IAdminGeographyRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<PagedResult<AdminProvinceListItemDto>>> Handle(GetAdminProvincesQuery request, CancellationToken ct)
    {
        var result = await _repo.GetProvincesAsync(
            request.RegionId,
            request.Status,
            request.Featured,
            request.Keyword,
            request.Page,
            request.PageSize,
            ct);

        return Result<PagedResult<AdminProvinceListItemDto>>.Success(result);
    }
}

public record GetAdminProvinceByIdQuery(int Id) : IRequest<Result<AdminProvinceDetailDto>>;

public class GetAdminProvinceByIdQueryHandler : IRequestHandler<GetAdminProvinceByIdQuery, Result<AdminProvinceDetailDto>>
{
    private readonly IAdminGeographyRepository _repo;

    public GetAdminProvinceByIdQueryHandler(IAdminGeographyRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<AdminProvinceDetailDto>> Handle(GetAdminProvinceByIdQuery request, CancellationToken ct)
    {
        var item = await _repo.GetProvinceByIdAsync(request.Id, ct);
        if (item == null)
            return Result<AdminProvinceDetailDto>.Failure("Không tìm thấy tỉnh/thành phố.", HttpStatusCode.NotFound);

        return Result<AdminProvinceDetailDto>.Success(item);
    }
}

// === COMMANDS ===

public record CreateAdminProvinceCommand(CreateAdminProvinceRequest Input) : IRequest<Result<int>>;

public class CreateAdminProvinceCommandHandler : IRequestHandler<CreateAdminProvinceCommand, Result<int>>
{
    private readonly IAdminGeographyRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public CreateAdminProvinceCommandHandler(IAdminGeographyRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<int>> Handle(CreateAdminProvinceCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<int>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền tạo tỉnh/thành mới.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<int>.Failure("Tên tỉnh/thành phố không được để trống.", HttpStatusCode.BadRequest);

        if (request.Input.RegionId <= 0)
            return Result<int>.Failure("Vui lòng chọn Vùng/miền trực thuộc hợp lệ.", HttpStatusCode.BadRequest);

        try
        {
            var adminId = _currentUserService.UserId ?? 1;
            var newId = await _repo.CreateProvinceAsync(request.Input, adminId, ct);
            return Result<int>.Success(newId, "Tạo mới tỉnh/thành phố thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<int>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminProvinceCommand(
    int Id, 
    UpdateAdminProvinceRequest Input, 
    FileUploadModel? ImageFile = null) : IRequest<Result<bool>>;

public class UpdateAdminProvinceCommandHandler : IRequestHandler<UpdateAdminProvinceCommand, Result<bool>>
{
    private readonly IAdminGeographyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBlobService _blobService;
    private readonly ICacheService _cacheService;

    public UpdateAdminProvinceCommandHandler(
        IAdminGeographyRepository repo, 
        ICurrentUserService currentUserService,
        IBlobService blobService,
        ICacheService cacheService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _blobService = blobService;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminProvinceCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền cập nhật tỉnh/thành phố.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<bool>.Failure("Tên tỉnh/thành phố không được để trống.", HttpStatusCode.BadRequest);

        if (request.Input.RegionId <= 0)
            return Result<bool>.Failure("Vui lòng chọn Vùng/miền trực thuộc hợp lệ.", HttpStatusCode.BadRequest);

        // Upload hình ảnh lên Azure Blob Storage nếu có tệp đính kèm
        if (request.ImageFile != null && request.ImageFile.Content != null && request.ImageFile.Content.Length > 0)
        {
            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (request.ImageFile.Content.Length > maxFileSize)
            {
                return Result<bool>.Failure("Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB).", HttpStatusCode.BadRequest);
            }

            var ext = Path.GetExtension(request.ImageFile.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(ext))
            {
                return Result<bool>.Failure($"Định dạng tệp '{ext}' không được hỗ trợ. Chỉ chấp nhận .jpg, .jpeg, .png, .webp.", HttpStatusCode.BadRequest);
            }

            try
            {
                var uploadedUrl = await _blobService.UploadImageAsync(
                    request.ImageFile.Content,
                    request.ImageFile.FileName,
                    request.ImageFile.ContentType,
                    "provinces",
                    ct);

                request.Input.ImageUrl = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure($"Lỗi khi tải ảnh tỉnh/thành lên Azure Blob Storage: {ex.Message}", HttpStatusCode.InternalServerError);
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Input.ImageUrl) && 
                 request.Input.ImageUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uploadedUrl = await _blobService.UploadBase64ImageAsync(
                    request.Input.ImageUrl,
                    "provinces",
                    ct);

                request.Input.ImageUrl = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure($"Lỗi khi tải ảnh Base64 lên Azure Blob Storage: {ex.Message}", HttpStatusCode.InternalServerError);
            }
        }

        try
        {
            var adminId = _currentUserService.UserId ?? 1;
            var ok = await _repo.UpdateProvinceAsync(request.Id, request.Input, adminId, ct);
            if (!ok)
                return Result<bool>.Failure("Không tìm thấy tỉnh/thành phố cần cập nhật.", HttpStatusCode.NotFound);

            await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
            return Result<bool>.Success(true, "Cập nhật tỉnh/thành phố thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<bool>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminProvinceStatusCommand(int Id, byte Status, string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminProvinceStatusCommandHandler : IRequestHandler<UpdateAdminProvinceStatusCommand, Result<bool>>
{
    private readonly IAdminGeographyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICacheService _cacheService;

    public UpdateAdminProvinceStatusCommandHandler(
        IAdminGeographyRepository repo, 
        ICurrentUserService currentUserService,
        ICacheService cacheService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminProvinceStatusCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền thay đổi trạng thái tỉnh/thành.", HttpStatusCode.Forbidden);

        if (request.Status != 1 && request.Status != 2)
            return Result<bool>.Failure("Trạng thái không hợp lệ. Chỉ chấp nhận 1 (Active) hoặc 2 (Inactive).", HttpStatusCode.BadRequest);

        var adminId = _currentUserService.UserId ?? 1;
        var ok = await _repo.UpdateProvinceStatusAsync(request.Id, request.Status, request.Reason, adminId, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy tỉnh/thành phố cần thay đổi trạng thái.", HttpStatusCode.NotFound);

        await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
        return Result<bool>.Success(true, request.Status == 1 ? "Đã kích hoạt hiển thị tỉnh/thành phố." : "Đã tạm ẩn tỉnh/thành phố.");
    }
}
