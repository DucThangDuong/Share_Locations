using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Trips;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Trips;

public class UpdateAdminTripStatusRequest : UpdateAdminTripStatusInput
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class UpdateAdminTripStatusEndpoint : Endpoint<UpdateAdminTripStatusRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/admin/trips/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.AnyAdmin);
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Cập nhật trạng thái lịch trình (Admin)";
            s.Description = "Thay đổi trạng thái kiểm duyệt hoặc hiển thị của lịch trình chuyến đi.";
        });
    }

    public override async Task HandleAsync(UpdateAdminTripStatusRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminTripStatusCommand(req.Id, req.Status, req.Reason), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
