using System.Net;
using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Notifications;

// ==========================================
// 1. QUERIES
// ==========================================

public record GetMyNotificationsQuery(int Page = 1, int PageSize = 20, bool? UnreadOnly = null)
    : IRequest<Result<NotificationPagedResultDto>>;

public class GetMyNotificationsQueryHandler : IRequestHandler<GetMyNotificationsQuery, Result<NotificationPagedResultDto>>
{
    private readonly INotificationRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public GetMyNotificationsQueryHandler(INotificationRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<NotificationPagedResultDto>> Handle(GetMyNotificationsQuery request, CancellationToken ct)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
            return Result<NotificationPagedResultDto>.Failure("Vui lòng đăng nhập để xem thông báo.", HttpStatusCode.Unauthorized);

        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : (request.PageSize > 100 ? 100 : request.PageSize);

        var result = await _repo.GetPagedNotificationsAsync(userId.Value, page, pageSize, request.UnreadOnly, ct);
        return Result<NotificationPagedResultDto>.Success(result);
    }
}

public record GetMyUnreadNotificationCountQuery : IRequest<Result<int>>;

public class GetMyUnreadNotificationCountQueryHandler : IRequestHandler<GetMyUnreadNotificationCountQuery, Result<int>>
{
    private readonly INotificationRepository _repo;
    private readonly ICurrentUserService _currentUserService;

    public GetMyUnreadNotificationCountQueryHandler(INotificationRepository repo, ICurrentUserService currentUserService)
    {
        _repo = repo;
        _currentUserService = currentUserService;
    }

    public async Task<Result<int>> Handle(GetMyUnreadNotificationCountQuery request, CancellationToken ct)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
            return Result<int>.Success(0);

        var count = await _repo.GetUnreadCountAsync(userId.Value, ct);
        return Result<int>.Success(count);
    }
}

// ==========================================
// 2. COMMANDS
// ==========================================

public record MarkNotificationAsReadCommand(long Id) : IRequest<Result<bool>>;

public class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand, Result<bool>>
{
    private readonly INotificationRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationNotifier _notifier;

    public MarkNotificationAsReadCommandHandler(
        INotificationRepository repo,
        ICurrentUserService currentUserService,
        INotificationNotifier notifier)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _notifier = notifier;
    }

    public async Task<Result<bool>> Handle(MarkNotificationAsReadCommand request, CancellationToken ct)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
            return Result<bool>.Failure("Vui lòng đăng nhập.", HttpStatusCode.Unauthorized);

        var ok = await _repo.MarkAsReadAsync(request.Id, userId.Value, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy thông báo hoặc thông báo đã được đọc.", HttpStatusCode.NotFound);

        // Update realtime unread count
        var unread = await _repo.GetUnreadCountAsync(userId.Value, ct);
        await _notifier.NotifyUnreadCountAsync(userId.Value, unread, ct);

        return Result<bool>.Success(true, "Đã đánh dấu thông báo là đã đọc.");
    }
}

public record MarkAllNotificationsAsReadCommand : IRequest<Result<int>>;

public class MarkAllNotificationsAsReadCommandHandler : IRequestHandler<MarkAllNotificationsAsReadCommand, Result<int>>
{
    private readonly INotificationRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationNotifier _notifier;

    public MarkAllNotificationsAsReadCommandHandler(
        INotificationRepository repo,
        ICurrentUserService currentUserService,
        INotificationNotifier notifier)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _notifier = notifier;
    }

    public async Task<Result<int>> Handle(MarkAllNotificationsAsReadCommand request, CancellationToken ct)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
            return Result<int>.Failure("Vui lòng đăng nhập.", HttpStatusCode.Unauthorized);

        var count = await _repo.MarkAllAsReadAsync(userId.Value, ct);

        // Update realtime unread count to 0
        await _notifier.NotifyUnreadCountAsync(userId.Value, 0, ct);

        return Result<int>.Success(count, $"Đã đánh dấu toàn bộ {count} thông báo là đã đọc.");
    }
}

public record DeleteNotificationCommand(long Id) : IRequest<Result<bool>>;

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, Result<bool>>
{
    private readonly INotificationRepository _repo;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationNotifier _notifier;

    public DeleteNotificationCommandHandler(
        INotificationRepository repo,
        ICurrentUserService currentUserService,
        INotificationNotifier notifier)
    {
        _repo = repo;
        _currentUserService = currentUserService;
        _notifier = notifier;
    }

    public async Task<Result<bool>> Handle(DeleteNotificationCommand request, CancellationToken ct)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
            return Result<bool>.Failure("Vui lòng đăng nhập.", HttpStatusCode.Unauthorized);

        var ok = await _repo.DeleteOrArchiveAsync(request.Id, userId.Value, ct);
        if (!ok)
            return Result<bool>.Failure("Không tìm thấy thông báo cần xóa.", HttpStatusCode.NotFound);

        var unread = await _repo.GetUnreadCountAsync(userId.Value, ct);
        await _notifier.NotifyUnreadCountAsync(userId.Value, unread, ct);

        return Result<bool>.Success(true, "Đã xóa thông báo thành công.");
    }
}

public record CreateNotificationCommand(CreateNotificationInput Input) : IRequest<Result<NotificationDto>>;

public class CreateNotificationCommandHandler : IRequestHandler<CreateNotificationCommand, Result<NotificationDto>>
{
    private readonly INotificationRepository _repo;
    private readonly INotificationNotifier _notifier;

    public CreateNotificationCommandHandler(INotificationRepository repo, INotificationNotifier notifier)
    {
        _repo = repo;
        _notifier = notifier;
    }

    public async Task<Result<NotificationDto>> Handle(CreateNotificationCommand request, CancellationToken ct)
    {
        var dto = await _repo.CreateNotificationAsync(request.Input, ct);

        // Realtime push notification & updated badge count
        var unread = await _repo.GetUnreadCountAsync(request.Input.UserId, ct);
        await _notifier.NotifyAsync(request.Input.UserId, dto, unread, ct);

        return Result<NotificationDto>.Success(dto);
    }
}
