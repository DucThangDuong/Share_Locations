using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Settings;

// === QUERIES ===

public record GetAdminSystemSettingsQuery(string? Group = null) : IRequest<Result<IReadOnlyList<AdminSystemSettingDto>>>;

public class GetAdminSystemSettingsQueryHandler : IRequestHandler<GetAdminSystemSettingsQuery, Result<IReadOnlyList<AdminSystemSettingDto>>>
{
    private readonly IAdminSystemConfigRepository _repo;

    public GetAdminSystemSettingsQueryHandler(IAdminSystemConfigRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<IReadOnlyList<AdminSystemSettingDto>>> Handle(GetAdminSystemSettingsQuery request, CancellationToken ct)
    {
        var items = await _repo.GetSystemSettingsAsync(request.Group, ct);
        return Result<IReadOnlyList<AdminSystemSettingDto>>.Success(items);
    }
}

// === COMMANDS ===

public record UpdateAdminSystemSettingCommand(string Key, string Value, string? Description) : IRequest<Result<bool>>;

public class UpdateAdminSystemSettingCommandHandler : IRequestHandler<UpdateAdminSystemSettingCommand, Result<bool>>
{
    private readonly IAdminSystemConfigRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public UpdateAdminSystemSettingCommandHandler(IAdminSystemConfigRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminSystemSettingCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền chỉnh sửa cài đặt hệ thống.", HttpStatusCode.Forbidden);

        var adminId = _currentUserService.UserId ?? 1;
        var ok = await _repo.UpdateSystemSettingAsync(request.Key, request.Value, request.Description, adminId, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy khóa cài đặt cần cập nhật.", HttpStatusCode.NotFound);

        return Result<bool>.Success(true, $"Đã cập nhật tham số '{request.Key}' thành công.");
    }
}

public record BatchUpdateAdminSystemSettingsCommand(Dictionary<string, string> Settings) : IRequest<Result<int>>;

public class BatchUpdateAdminSystemSettingsCommandHandler : IRequestHandler<BatchUpdateAdminSystemSettingsCommand, Result<int>>
{
    private readonly IAdminSystemConfigRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public BatchUpdateAdminSystemSettingsCommandHandler(IAdminSystemConfigRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<int>> Handle(BatchUpdateAdminSystemSettingsCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<int>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền chỉnh sửa cài đặt hệ thống.", HttpStatusCode.Forbidden);

        if (request.Settings == null || request.Settings.Count == 0)
            return Result<int>.Failure("Danh sách cài đặt không được để rỗng.", HttpStatusCode.BadRequest);

        var adminId = _currentUserService.UserId ?? 1;
        var count = await _repo.BatchUpdateSystemSettingsAsync(request.Settings, adminId, ct);

        return Result<int>.Success(count, $"Đã cập nhật đồng loạt {count} tham số hệ thống thành công.");
    }
}
