using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Admin.Catalog.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class UpdateAdminCollectionStatusRequest
{
    public int Id { get; set; }
    public int? Status { get; set; }
    public string? Reason { get; set; }
}

public class UpdateAdminCollectionStatusEndpoint : Endpoint<UpdateAdminCollectionStatusRequest, ApiSuccessResponse<UpdateCollectionStatusResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Routes("/api/admin/collections/{id}/status");
        Verbs(Http.PATCH, Http.PUT);
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Chuyển đổi trạng thái bộ sưu tập (Admin)";
            s.Description = "Chuyển đổi trạng thái hoạt động của bộ sưu tập giữa 1 (Đang hoạt động) và 0 (Tạm ẩn).";
        });
    }

    public override async Task HandleAsync(UpdateAdminCollectionStatusRequest req, CancellationToken ct)
    {
        if (req.Id <= 0)
        {
            await this.SendApiResponseAsync(
                Result<UpdateCollectionStatusResultDto>.Failure("Mã bộ sưu tập (Id) không hợp lệ."),
                ct);
            return;
        }

        int targetStatus = req.Status.HasValue ? (req.Status.Value == 1 ? 1 : 0) : 1;
        var result = await Mediator.Send(new UpdateAdminCollectionStatusCommand(req.Id, targetStatus), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
