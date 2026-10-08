using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Catalog;

// === QUERIES ===

public record GetAdminPlaceTypesQuery(bool? ActiveOnly = null) : IRequest<Result<IReadOnlyList<AdminPlaceTypeListItemDto>>>;

public class GetAdminPlaceTypesQueryHandler : IRequestHandler<GetAdminPlaceTypesQuery, Result<IReadOnlyList<AdminPlaceTypeListItemDto>>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;

    public GetAdminPlaceTypesQueryHandler(IAdminCatalogTaxonomyRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<IReadOnlyList<AdminPlaceTypeListItemDto>>> Handle(GetAdminPlaceTypesQuery request, CancellationToken ct)
    {
        var items = await _repo.GetPlaceTypesAsync(request.ActiveOnly, ct);
        return Result<IReadOnlyList<AdminPlaceTypeListItemDto>>.Success(items);
    }
}

public record GetAdminPlaceTypeByIdQuery(int Id) : IRequest<Result<AdminPlaceTypeListItemDto>>;

public class GetAdminPlaceTypeByIdQueryHandler : IRequestHandler<GetAdminPlaceTypeByIdQuery, Result<AdminPlaceTypeListItemDto>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;

    public GetAdminPlaceTypeByIdQueryHandler(IAdminCatalogTaxonomyRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<AdminPlaceTypeListItemDto>> Handle(GetAdminPlaceTypeByIdQuery request, CancellationToken ct)
    {
        var item = await _repo.GetPlaceTypeByIdAsync(request.Id, ct);
        if (item == null)
            return Result<AdminPlaceTypeListItemDto>.Failure("Không tìm thấy loại địa điểm.", HttpStatusCode.NotFound);

        return Result<AdminPlaceTypeListItemDto>.Success(item);
    }
}

// === COMMANDS ===

public record CreateAdminPlaceTypeCommand(
    CreateAdminPlaceTypeRequest Input, 
    FileUploadModel? ImageFile = null) : IRequest<Result<int>>;

public class CreateAdminPlaceTypeCommandHandler : IRequestHandler<CreateAdminPlaceTypeCommand, Result<int>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBlobService _blobService;
    private readonly ICacheService _cacheService;

    public CreateAdminPlaceTypeCommandHandler(
        IAdminCatalogTaxonomyRepository repo, 
        ICurrentUserService currentUserService,
        IBlobService blobService,
        ICacheService cacheService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _blobService = blobService;
        _cacheService = cacheService;
    }

    public async Task<Result<int>> Handle(CreateAdminPlaceTypeCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<int>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền tạo loại địa điểm mới.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<int>.Failure("Tên loại địa điểm không được để trống.", HttpStatusCode.BadRequest);

        // Upload hình ảnh lên Azure Blob Storage nếu có tệp đính kèm
        if (request.ImageFile != null && request.ImageFile.Content != null && request.ImageFile.Content.Length > 0)
        {
            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (request.ImageFile.Content.Length > maxFileSize)
            {
                return Result<int>.Failure("Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB).", HttpStatusCode.BadRequest);
            }

            var ext = Path.GetExtension(request.ImageFile.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(ext))
            {
                return Result<int>.Failure($"Định dạng tệp '{ext}' không được hỗ trợ. Chỉ chấp nhận .jpg, .jpeg, .png, .webp.", HttpStatusCode.BadRequest);
            }

            try
            {
                var uploadedUrl = await _blobService.UploadImageAsync(
                    request.ImageFile.Content,
                    request.ImageFile.FileName,
                    request.ImageFile.ContentType,
                    "placetypes",
                    ct);

                request.Input.ImageUrl = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<int>.Failure($"Lỗi khi tải ảnh loại địa điểm lên Azure Blob Storage: {ex.Message}", HttpStatusCode.InternalServerError);
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Input.ImageUrl) && 
                 request.Input.ImageUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uploadedUrl = await _blobService.UploadBase64ImageAsync(
                    request.Input.ImageUrl,
                    "placetypes",
                    ct);

                request.Input.ImageUrl = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<int>.Failure($"Lỗi khi tải ảnh Base64 lên Azure Blob Storage: {ex.Message}", HttpStatusCode.InternalServerError);
            }
        }

        try
        {
            var adminId = _currentUserService.UserId ?? 1;
            var newId = await _repo.CreatePlaceTypeAsync(request.Input, adminId, ct);
            await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
            return Result<int>.Success(newId, "Tạo mới loại địa điểm thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<int>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminPlaceTypeCommand(
    int Id, 
    UpdateAdminPlaceTypeRequest Input, 
    FileUploadModel? ImageFile = null) : IRequest<Result<bool>>;

public class UpdateAdminPlaceTypeCommandHandler : IRequestHandler<UpdateAdminPlaceTypeCommand, Result<bool>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBlobService _blobService;
    private readonly ICacheService _cacheService;

    public UpdateAdminPlaceTypeCommandHandler(
        IAdminCatalogTaxonomyRepository repo, 
        ICurrentUserService currentUserService,
        IBlobService blobService,
        ICacheService cacheService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _blobService = blobService;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminPlaceTypeCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền cập nhật loại địa điểm.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<bool>.Failure("Tên loại địa điểm không được để trống.", HttpStatusCode.BadRequest);

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
                    "placetypes",
                    ct);

                request.Input.ImageUrl = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure($"Lỗi khi tải ảnh loại địa điểm lên Azure Blob Storage: {ex.Message}", HttpStatusCode.InternalServerError);
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Input.ImageUrl) && 
                 request.Input.ImageUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uploadedUrl = await _blobService.UploadBase64ImageAsync(
                    request.Input.ImageUrl,
                    "placetypes",
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
            var ok = await _repo.UpdatePlaceTypeAsync(request.Id, request.Input, adminId, ct);
            if (!ok)
                return Result<bool>.Failure("Không tìm thấy loại địa điểm cần cập nhật.", HttpStatusCode.NotFound);

            await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
            return Result<bool>.Success(true, "Cập nhật loại địa điểm thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<bool>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminPlaceTypeStatusCommand(int Id, byte Status, string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminPlaceTypeStatusCommandHandler : IRequestHandler<UpdateAdminPlaceTypeStatusCommand, Result<bool>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICacheService _cacheService;

    public UpdateAdminPlaceTypeStatusCommandHandler(
        IAdminCatalogTaxonomyRepository repo, 
        ICurrentUserService currentUserService,
        ICacheService cacheService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminPlaceTypeStatusCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền thay đổi trạng thái loại địa điểm.", HttpStatusCode.Forbidden);

        if (request.Status != 1 && request.Status != 2)
            return Result<bool>.Failure("Trạng thái không hợp lệ. Chỉ chấp nhận 1 (Active) hoặc 2 (Inactive).", HttpStatusCode.BadRequest);

        var adminId = _currentUserService.UserId ?? 1;
        var ok = await _repo.UpdatePlaceTypeStatusAsync(request.Id, request.Status, request.Reason, adminId, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy loại địa điểm cần thay đổi trạng thái.", HttpStatusCode.NotFound);

        await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);

        return Result<bool>.Success(true, request.Status == 1 ? "Đã kích hoạt hiển thị loại địa điểm." : "Đã tạm ẩn loại địa điểm.");
    }
}
