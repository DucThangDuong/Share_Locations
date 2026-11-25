using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Trips;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Trips;

public class UpdateAdminTripPrivacyRequest : UpdateAdminTripPrivacyInput
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class UpdateAdminTripPrivacyEndpoint : Endpoint<UpdateAdminTripPrivacyRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/admin/trips/{id}/privacy");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.AnyAdmin);
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Cập nhật chế độ riêng tư lịch trình (Admin)";
            s.Description = "Thay đổi chế độ hiển thị của lịch trình (0: Riêng tư, 1: Bạn bè, 2: Công khai).";
        });
    }

    public override async Task HandleAsync(UpdateAdminTripPrivacyRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminTripPrivacyCommand(req.Id, req.Privacy, req.Reason), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
