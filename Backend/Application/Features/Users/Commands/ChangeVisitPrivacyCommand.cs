using Application.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Users.Commands;

public record ChangeVisitPrivacyCommand(long Id, long UserId, int Privacy) : IRequest<Result>;

public class ChangeVisitPrivacyCommandHandler : IRequestHandler<ChangeVisitPrivacyCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public ChangeVisitPrivacyCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(ChangeVisitPrivacyCommand request, CancellationToken ct)
    {
        var log = await _unitOfWork.VisitLogs.GetByIdAsync(request.Id, ct);
        if (log == null)
        {
            return Result.NotFound("Không tìm thấy bản ghi nhật ký.");
        }

        if (log.UserId != request.UserId)
        {
            return Result.Forbidden("Bạn không có quyền chỉnh sửa nhật ký này.");
        }

        var privacy = Enum.IsDefined(typeof(VisitPrivacy), (byte)request.Privacy)
            ? (VisitPrivacy)request.Privacy
            : VisitPrivacy.Public;

        log.UpdatePrivacy(privacy);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Đã cập nhật trạng thái riêng tư.");
    }
}
