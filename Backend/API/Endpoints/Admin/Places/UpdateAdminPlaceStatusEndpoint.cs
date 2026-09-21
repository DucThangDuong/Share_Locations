using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Places;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Places;

public class UpdateAdminPlaceStatusRequest : UpdatePlaceStatusInput
{
    public long Id { get; set; }
}

public class UpdateAdminPlaceStatusEndpoint : Endpoint<UpdateAdminPlaceStatusRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/admin/places/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Chuyển đổi trạng thái hiển thị địa điểm (Admin)";
            s.Description = "Duyệt (1), Tạm ẩn (3), Khôi phục hiển thị hoặc Từ chối (2) địa điểm.";
        });
    }

    public override async Task HandleAsync(UpdateAdminPlaceStatusRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminPlaceStatusCommand(req.Id, req.StatusNum, req.Reason), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
