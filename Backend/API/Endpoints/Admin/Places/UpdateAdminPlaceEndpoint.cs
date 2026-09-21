using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Places;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Places;

public class UpdateAdminPlaceRequest : UpdateAdminPlaceInput
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class UpdateAdminPlaceEndpoint : Endpoint<UpdateAdminPlaceRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/places/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Cập nhật thông tin địa điểm (Admin)";
            s.Description = "Cập nhật toàn diện thông tin địa điểm.";
        });
    }

    public override async Task HandleAsync(UpdateAdminPlaceRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminPlaceCommand(req.Id, req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
