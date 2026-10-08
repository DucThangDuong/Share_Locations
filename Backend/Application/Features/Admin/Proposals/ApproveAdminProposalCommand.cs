using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Proposals;

public record ApproveAdminProposalCommand(
    long ProposalId,
    long AdminId,
    long? TargetPlaceId = null,
    string? AdminNote = null) : IRequest<Result<bool>>;

public class ApproveAdminProposalCommandHandler : IRequestHandler<ApproveAdminProposalCommand, Result<bool>>
{
    private readonly IAdminProposalRepository _proposalRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notifier;

    public ApproveAdminProposalCommandHandler(
        IAdminProposalRepository proposalRepository,
        INotificationRepository notificationRepository,
        INotificationNotifier notifier)
    {
        _proposalRepository = proposalRepository;
        _notificationRepository = notificationRepository;
        _notifier = notifier;
    }

    public async Task<Result<bool>> Handle(ApproveAdminProposalCommand request, CancellationToken ct)
    {
        var detail = await _proposalRepository.GetProposalDetailAsync(request.ProposalId, ct);

        var success = await _proposalRepository.ApproveProposalAsync(
            request.ProposalId,
            request.AdminId,
            request.TargetPlaceId,
            request.AdminNote,
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
                    Title = "Đề xuất địa điểm đã được phê duyệt",
                    Content = $"Chúc mừng! Đề xuất địa điểm '{placeName}' của bạn đã được phê duyệt thành công.",
                    Type = Domain.Enums.NotificationType.Proposal,
                    Priority = 2,
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

        return Result<bool>.Success(true, "Đã phê duyệt đề xuất thành công.");
    }
}
