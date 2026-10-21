using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Places;
using Domain.Constants;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Places;

public class DeleteAdminPlaceRequest
{
    public long Id { get; set; }
}

public class DeleteAdminPlaceEndpoint : Endpoint<DeleteAdminPlaceRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/places/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(AppRoles.AnyAdmin);
        Summary(s =>
        {
            s.Summary = "Xóa mềm địa điểm (Admin)";
            s.Description = "Đánh dấu IsDeleted = true cho địa điểm. Hỗ trợ SystemAdmin và CategoryAdmin theo phạm vi quản lý.";
        });
    }

    public override async Task HandleAsync(DeleteAdminPlaceRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminPlaceCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
