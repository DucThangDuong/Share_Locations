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

public record GetAdminRegionsQuery(bool? ActiveOnly = null) : IRequest<Result<IReadOnlyList<AdminRegionListItemDto>>>;

public class GetAdminRegionsQueryHandler : IRequestHandler<GetAdminRegionsQuery, Result<IReadOnlyList<AdminRegionListItemDto>>>
{
    private readonly IAdminGeographyRepository _repo;

    public GetAdminRegionsQueryHandler(IAdminGeographyRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<IReadOnlyList<AdminRegionListItemDto>>> Handle(GetAdminRegionsQuery request, CancellationToken ct)
    {
        var items = await _repo.GetRegionsAsync(request.ActiveOnly, ct);
        return Result<IReadOnlyList<AdminRegionListItemDto>>.Success(items);
    }
}

public record GetAdminRegionByIdQuery(int Id) : IRequest<Result<AdminRegionListItemDto>>;

public class GetAdminRegionByIdQueryHandler : IRequestHandler<GetAdminRegionByIdQuery, Result<AdminRegionListItemDto>>
{
    private readonly IAdminGeographyRepository _repo;

    public GetAdminRegionByIdQueryHandler(IAdminGeographyRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<AdminRegionListItemDto>> Handle(GetAdminRegionByIdQuery request, CancellationToken ct)
    {
        var item = await _repo.GetRegionByIdAsync(request.Id, ct);
        if (item == null)
            return Result<AdminRegionListItemDto>.Failure("Không tìm thấy vùng/miền.", HttpStatusCode.NotFound);

        return Result<AdminRegionListItemDto>.Success(item);
    }
}

// === COMMANDS ===

public record CreateAdminRegionCommand(CreateAdminRegionRequest Input) : IRequest<Result<int>>;

public class CreateAdminRegionCommandHandler : IRequestHandler<CreateAdminRegionCommand, Result<int>>
{
    private readonly IAdminGeographyRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public CreateAdminRegionCommandHandler(IAdminGeographyRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<int>> Handle(CreateAdminRegionCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<int>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền tạo vùng/miền mới.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<int>.Failure("Tên vùng/miền không được để trống.", HttpStatusCode.BadRequest);

        try
        {
            var adminId = _currentUserService.UserId ?? 1;
            var newId = await _repo.CreateRegionAsync(request.Input, adminId, ct);
            return Result<int>.Success(newId, "Tạo mới vùng/miền thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<int>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminRegionCommand(
    int Id, 
    UpdateAdminRegionRequest Input, 
    FileUploadModel? ImageFile = null) : IRequest<Result<bool>>;

public class UpdateAdminRegionCommandHandler : IRequestHandler<UpdateAdminRegionCommand, Result<bool>>
{
    private readonly IAdminGeographyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBlobService _blobService;
    private readonly ICacheService _cacheService;

    public UpdateAdminRegionCommandHandler(
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

    public async Task<Result<bool>> Handle(UpdateAdminRegionCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền cập nhật vùng/miền.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<bool>.Failure("Tên vùng/miền không được để trống.", HttpStatusCode.BadRequest);

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
                    "regions",
                    ct);

                request.Input.ImageUrl = uploadedUrl;
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure($"Lỗi khi tải ảnh vùng/miền lên Azure Blob Storage: {ex.Message}", HttpStatusCode.InternalServerError);
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Input.ImageUrl) && 
                 request.Input.ImageUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uploadedUrl = await _blobService.UploadBase64ImageAsync(
                    request.Input.ImageUrl,
                    "regions",
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
            var ok = await _repo.UpdateRegionAsync(request.Id, request.Input, adminId, ct);
            if (!ok)
                return Result<bool>.Failure("Không tìm thấy vùng/miền cần cập nhật.", HttpStatusCode.NotFound);

            await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
            return Result<bool>.Success(true, "Cập nhật vùng/miền thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<bool>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminRegionStatusCommand(int Id, byte Status, string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminRegionStatusCommandHandler : IRequestHandler<UpdateAdminRegionStatusCommand, Result<bool>>
{
    private readonly IAdminGeographyRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICacheService _cacheService;

    public UpdateAdminRegionStatusCommandHandler(
        IAdminGeographyRepository repo, 
        ICurrentUserService currentUserService,
        ICacheService cacheService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminRegionStatusCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền thay đổi trạng thái vùng/miền.", HttpStatusCode.Forbidden);

        if (request.Status != 1 && request.Status != 2)
            return Result<bool>.Failure("Trạng thái không hợp lệ. Chỉ chấp nhận 1 (Active) hoặc 2 (Inactive).", HttpStatusCode.BadRequest);

        var adminId = _currentUserService.UserId ?? 1;
        var ok = await _repo.UpdateRegionStatusAsync(request.Id, request.Status, request.Reason, adminId, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy vùng/miền cần thay đổi trạng thái.", HttpStatusCode.NotFound);

        await CatalogCacheInvalidator.InvalidateCatalogCachesAsync(_cacheService, ct);
        return Result<bool>.Success(true, request.Status == 1 ? "Đã kích hoạt hiển thị vùng/miền." : "Đã tạm ẩn vùng/miền.");
    }
}
