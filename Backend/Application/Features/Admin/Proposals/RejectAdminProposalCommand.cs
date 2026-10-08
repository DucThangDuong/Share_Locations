using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Proposals;

public record RejectAdminProposalCommand(
    long ProposalId,
    long AdminId,
    string RejectionReason) : IRequest<Result<bool>>;

public class RejectAdminProposalCommandHandler : IRequestHandler<RejectAdminProposalCommand, Result<bool>>
{
    private readonly IAdminProposalRepository _proposalRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;

    public RejectAdminProposalCommandHandler(
        IAdminProposalRepository proposalRepository,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier)
    {
        _proposalRepository = proposalRepository;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
    }

    public async Task<Result<bool>> Handle(RejectAdminProposalCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            return Result<bool>.Failure("Vui lòng nhập lý do từ chối đề xuất.");
        }

        var detail = await _proposalRepository.GetProposalDetailAsync(request.ProposalId, ct);

        var success = await _proposalRepository.RejectProposalAsync(
            request.ProposalId,
            request.AdminId,
            request.RejectionReason.Trim(),
            ct);

        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy đề xuất đóng góp.");
        }

        if (detail?.Proposer?.Id > 0)
        {
            try
            {
                var placeName = !string.IsNullOrWhiteSpace(detail.PlaceData?.Name) ? detail.PlaceData.Name : "Địa điểm mới";
                var notif = await _notificationRepository.CreateNotificationAsync(new DTOs.CreateNotificationInput
                {
                    UserId = detail.Proposer.Id,
                    ActorUserId = request.AdminId,
                    Title = "Đề xuất địa điểm cần bổ sung / bị từ chối",
                    Content = $"Đề xuất '{placeName}' của bạn đã bị từ chối. Lý do: {request.RejectionReason.Trim()}",
                    Type = Domain.Enums.NotificationType.Proposal,
                    Priority = 1,
                    EntityType = "PROPOSAL",
                    EntityId = request.ProposalId,
                    TargetUrl = "/profile?tab=proposals",
                    GroupKey = $"PROPOSAL_{request.ProposalId}"
                }, ct);

                var unread = await _notificationRepository.GetUnreadCountAsync(detail.Proposer.Id, ct);
                await _notifier.NotifyAsync(detail.Proposer.Id, notif, unread, ct);
            }
            catch
            {
                // Non-blocking notification dispatch
            }
        }

        return Result<bool>.Success(true, "Đã từ chối đề xuất đóng góp.");
    }
}
