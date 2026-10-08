using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.AuditLogs;

public record GetAdminAuditLogsQuery(GetAdminAuditLogsRequestDto Filter)
    : IRequest<Result<PagedResult<AdminAuditLogListItemDto>>>;

public class GetAdminAuditLogsQueryHandler
    : IRequestHandler<GetAdminAuditLogsQuery, Result<PagedResult<AdminAuditLogListItemDto>>>
{
    private readonly IAdminAuditLogRepository _repository;

    public GetAdminAuditLogsQueryHandler(IAdminAuditLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<PagedResult<AdminAuditLogListItemDto>>> Handle(
        GetAdminAuditLogsQuery request,
        CancellationToken ct)
    {
        var result = await _repository.GetAuditLogsAsync(request.Filter, ct);
        return Result<PagedResult<AdminAuditLogListItemDto>>.Success(result);
    }
}
