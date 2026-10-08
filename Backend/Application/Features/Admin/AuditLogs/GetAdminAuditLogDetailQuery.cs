using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.AuditLogs;

public record GetAdminAuditLogDetailQuery(long Id)
    : IRequest<Result<AdminAuditLogDetailDto>>;

public class GetAdminAuditLogDetailQueryHandler
    : IRequestHandler<GetAdminAuditLogDetailQuery, Result<AdminAuditLogDetailDto>>
{
    private readonly IAdminAuditLogRepository _repository;

    public GetAdminAuditLogDetailQueryHandler(IAdminAuditLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<AdminAuditLogDetailDto>> Handle(
        GetAdminAuditLogDetailQuery request,
        CancellationToken ct)
    {
        var log = await _repository.GetAuditLogDetailAsync(request.Id, ct);
        if (log == null)
        {
            return Result<AdminAuditLogDetailDto>.NotFound($"Không tìm thấy nhật ký kiểm toán với mã #{request.Id}.");
        }

        return Result<AdminAuditLogDetailDto>.Success(log);
    }
}
