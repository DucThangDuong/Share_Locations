using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Catalog;

// === QUERIES ===

public record GetAdminCategoriesPagedQuery(
    int? PlaceTypeId,
    byte? Status,
    string? Keyword,
    int Page = 1,
    int PageSize = 50) : IRequest<Result<PagedResult<AdminCategoryTaxonomyListItemDto>>>;

public class GetAdminCategoriesPagedQueryHandler : IRequestHandler<GetAdminCategoriesPagedQuery, Result<PagedResult<AdminCategoryTaxonomyListItemDto>>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;

    public GetAdminCategoriesPagedQueryHandler(IAdminCatalogTaxonomyRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<PagedResult<AdminCategoryTaxonomyListItemDto>>> Handle(GetAdminCategoriesPagedQuery request, CancellationToken ct)
    {
        var result = await _repo.GetCategoriesAsync(
            request.PlaceTypeId,
            request.Status,
            request.Keyword,
            request.Page,
            request.PageSize,
            ct);

        return Result<PagedResult<AdminCategoryTaxonomyListItemDto>>.Success(result);
    }
}

public record GetAdminCategoryTaxonomyByIdQuery(int Id) : IRequest<Result<AdminCategoryTaxonomyListItemDto>>;

public class GetAdminCategoryTaxonomyByIdQueryHandler : IRequestHandler<GetAdminCategoryTaxonomyByIdQuery, Result<AdminCategoryTaxonomyListItemDto>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;

    public GetAdminCategoryTaxonomyByIdQueryHandler(IAdminCatalogTaxonomyRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<AdminCategoryTaxonomyListItemDto>> Handle(GetAdminCategoryTaxonomyByIdQuery request, CancellationToken ct)
    {
        var item = await _repo.GetCategoryByIdAsync(request.Id, ct);
        if (item == null)
            return Result<AdminCategoryTaxonomyListItemDto>.Failure("Không tìm thấy danh mục.", HttpStatusCode.NotFound);

        return Result<AdminCategoryTaxonomyListItemDto>.Success(item);
    }
}

// === COMMANDS ===

public record CreateAdminCategoryCommand(
    CreateAdminCategoryRequest Input, 
    FileUploadModel? ImageFile = null) : IRequest<Result<int>>;

public class CreateAdminCategoryCommandHandler : IRequestHandler<CreateAdminCategoryCommand, Result<int>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBlobService _blobService;
    private readonly ICacheService _cacheService;

    public CreateAdminCategoryCommandHandler(
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

    public async Task<Result<int>> Handle(CreateAdminCategoryCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<int>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền tạo danh mục mới.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<int>.Failure("Tên danh mục không được để trống.", HttpStatusCode.BadRequest);

        if (request.Input.PlaceTypeId <= 0)
            return Result<int>.Failure("Vui lòng chọn Loại hình/Trụ cột trực thuộc hợp lệ.", HttpStatusCode.BadRequest);

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
                    "categories",
                    ct);

                request.Input.ImageUrl = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<int>.Failure($"Lỗi khi tải ảnh danh mục lên Azure Blob Storage: {ex.Message}", HttpStatusCode.InternalServerError);
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Input.ImageUrl) && 
                 request.Input.ImageUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uploadedUrl = await _blobService.UploadBase64ImageAsync(
                    request.Input.ImageUrl,
                    "categories",
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
            var newId = await _repo.CreateCategoryAsync(request.Input, adminId, ct);
            await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
            return Result<int>.Success(newId, "Tạo mới danh mục thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<int>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminCategoryCommand(
    int Id, 
    UpdateAdminCategoryRequest Input, 
    FileUploadModel? ImageFile = null) : IRequest<Result<bool>>;

public class UpdateAdminCategoryCommandHandler : IRequestHandler<UpdateAdminCategoryCommand, Result<bool>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBlobService _blobService;
    private readonly ICacheService _cacheService;

    public UpdateAdminCategoryCommandHandler(
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

    public async Task<Result<bool>> Handle(UpdateAdminCategoryCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền cập nhật danh mục.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<bool>.Failure("Tên danh mục không được để trống.", HttpStatusCode.BadRequest);

        if (request.Input.PlaceTypeId <= 0)
            return Result<bool>.Failure("Vui lòng chọn Loại hình/Trụ cột trực thuộc hợp lệ.", HttpStatusCode.BadRequest);

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
                    "categories",
                    ct);

                request.Input.ImageUrl = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure($"Lỗi khi tải ảnh danh mục lên Azure Blob Storage: {ex.Message}", HttpStatusCode.InternalServerError);
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Input.ImageUrl) && 
                 request.Input.ImageUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uploadedUrl = await _blobService.UploadBase64ImageAsync(
                    request.Input.ImageUrl,
                    "categories",
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
            var ok = await _repo.UpdateCategoryAsync(request.Id, request.Input, adminId, ct);
            if (!ok)
                return Result<bool>.Failure("Không tìm thấy danh mục cần cập nhật.", HttpStatusCode.NotFound);

            await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
            return Result<bool>.Success(true, "Cập nhật danh mục thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<bool>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminCategoryStatusCommand(int Id, byte Status, string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminCategoryStatusCommandHandler : IRequestHandler<UpdateAdminCategoryStatusCommand, Result<bool>>
{
    private readonly IAdminCatalogTaxonomyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICacheService _cacheService;

    public UpdateAdminCategoryStatusCommandHandler(
        IAdminCatalogTaxonomyRepository repo, 
        ICurrentUserService currentUserService,
        ICacheService cacheService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminCategoryStatusCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền thay đổi trạng thái danh mục.", HttpStatusCode.Forbidden);

        if (request.Status != 1 && request.Status != 2)
            return Result<bool>.Failure("Trạng thái không hợp lệ. Chỉ chấp nhận 1 (Active) hoặc 2 (Inactive).", HttpStatusCode.BadRequest);

        var adminId = _currentUserService.UserId ?? 1;
        var ok = await _repo.UpdateCategoryStatusAsync(request.Id, request.Status, request.Reason, adminId, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy danh mục cần thay đổi trạng thái.", HttpStatusCode.NotFound);

        await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);

        return Result<bool>.Success(true, request.Status == 1 ? "Đã kích hoạt hiển thị danh mục." : "Đã tạm ẩn danh mục.");
    }
}
