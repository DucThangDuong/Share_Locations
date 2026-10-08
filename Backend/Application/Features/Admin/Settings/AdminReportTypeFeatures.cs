using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Settings;

// === QUERIES ===

public record GetAdminReportTypesQuery(string? TargetScope = null, bool? ActiveOnly = null) : IRequest<Result<IReadOnlyList<AdminReportTypeListItemDto>>>;

public class GetAdminReportTypesQueryHandler : IRequestHandler<GetAdminReportTypesQuery, Result<IReadOnlyList<AdminReportTypeListItemDto>>>
{
    private readonly IAdminSystemConfigRepository _repo;

    public GetAdminReportTypesQueryHandler(IAdminSystemConfigRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<IReadOnlyList<AdminReportTypeListItemDto>>> Handle(GetAdminReportTypesQuery request, CancellationToken ct)
    {
        var items = await _repo.GetReportTypesAsync(request.TargetScope, request.ActiveOnly, ct);
        return Result<IReadOnlyList<AdminReportTypeListItemDto>>.Success(items);
    }
}

public record GetAdminReportTypeByIdQuery(int Id) : IRequest<Result<AdminReportTypeListItemDto>>;

public class GetAdminReportTypeByIdQueryHandler : IRequestHandler<GetAdminReportTypeByIdQuery, Result<AdminReportTypeListItemDto>>
{
    private readonly IAdminSystemConfigRepository _repo;

    public GetAdminReportTypeByIdQueryHandler(IAdminSystemConfigRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<AdminReportTypeListItemDto>> Handle(GetAdminReportTypeByIdQuery request, CancellationToken ct)
    {
        var item = await _repo.GetReportTypeByIdAsync(request.Id, ct);
        if (item == null)
            return Result<AdminReportTypeListItemDto>.Failure("Không tìm thấy lý do báo cáo.", HttpStatusCode.NotFound);

        return Result<AdminReportTypeListItemDto>.Success(item);
    }
}

// === COMMANDS ===

public record CreateAdminReportTypeCommand(CreateAdminReportTypeRequest Input) : IRequest<Result<int>>;

public class CreateAdminReportTypeCommandHandler : IRequestHandler<CreateAdminReportTypeCommand, Result<int>>
{
    private readonly IAdminSystemConfigRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public CreateAdminReportTypeCommandHandler(IAdminSystemConfigRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<int>> Handle(CreateAdminReportTypeCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<int>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền tạo lý do báo cáo mới.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Code) || string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<int>.Failure("Mã và Tên lý do báo cáo không được để trống.", HttpStatusCode.BadRequest);

        try
        {
            var adminId = _currentUserService.UserId ?? 1;
            var newId = await _repo.CreateReportTypeAsync(request.Input, adminId, ct);
            return Result<int>.Success(newId, "Thêm mới lý do báo cáo thành công.");
        }
        catch (InvalidOperationException ex)
        {
            return Result<int>.Failure(ex.Message, HttpStatusCode.BadRequest);
        }
    }
}

public record UpdateAdminReportTypeCommand(int Id, UpdateAdminReportTypeRequest Input) : IRequest<Result<bool>>;

public class UpdateAdminReportTypeCommandHandler : IRequestHandler<UpdateAdminReportTypeCommand, Result<bool>>
{
    private readonly IAdminSystemConfigRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public UpdateAdminReportTypeCommandHandler(IAdminSystemConfigRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminReportTypeCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền cập nhật lý do báo cáo.", HttpStatusCode.Forbidden);

        if (string.IsNullOrWhiteSpace(request.Input.Name))
            return Result<bool>.Failure("Tên lý do báo cáo không được để trống.", HttpStatusCode.BadRequest);

        var adminId = _currentUserService.UserId ?? 1;
        var ok = await _repo.UpdateReportTypeAsync(request.Id, request.Input, adminId, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy lý do báo cáo cần cập nhật.", HttpStatusCode.NotFound);

        return Result<bool>.Success(true, "Cập nhật lý do báo cáo thành công.");
    }
}

public record UpdateAdminReportTypeStatusCommand(int Id, bool IsActive) : IRequest<Result<bool>>;

public class UpdateAdminReportTypeStatusCommandHandler : IRequestHandler<UpdateAdminReportTypeStatusCommand, Result<bool>>
{
    private readonly IAdminSystemConfigRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public UpdateAdminReportTypeStatusCommandHandler(IAdminSystemConfigRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminReportTypeStatusCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền thay đổi trạng thái lý do báo cáo.", HttpStatusCode.Forbidden);

        var adminId = _currentUserService.UserId ?? 1;
        var ok = await _repo.UpdateReportTypeStatusAsync(request.Id, request.IsActive, adminId, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy lý do báo cáo.", HttpStatusCode.NotFound);

        return Result<bool>.Success(true, request.IsActive ? "Đã kích hoạt lý do báo cáo." : "Đã tạm ẩn lý do báo cáo.");
    }
}

public record DeleteAdminReportTypeCommand(int Id) : IRequest<Result<bool>>;

public class DeleteAdminReportTypeCommandHandler : IRequestHandler<DeleteAdminReportTypeCommand, Result<bool>>
{
    private readonly IAdminSystemConfigRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public DeleteAdminReportTypeCommandHandler(IAdminSystemConfigRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(DeleteAdminReportTypeCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsSystemAdmin)
            return Result<bool>.Failure("Chỉ Quản trị viên hệ thống (SystemAdmin) mới có quyền xóa lý do báo cáo.", HttpStatusCode.Forbidden);

        var adminId = _currentUserService.UserId ?? 1;
        var (success, error) = await _repo.DeleteReportTypeAsync(request.Id, adminId, ct);
        if (!success)
            return Result<bool>.Failure(error ?? "Xóa lý do báo cáo thất bại.", HttpStatusCode.BadRequest);

        return Result<bool>.Success(true, "Đã xóa lý do báo cáo thành công.");
    }
}
