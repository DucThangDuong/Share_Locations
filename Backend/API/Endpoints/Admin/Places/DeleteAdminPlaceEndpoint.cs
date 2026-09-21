using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Places;
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
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xóa địa điểm (Admin)";
            s.Description = "Xóa địa điểm khỏi hệ thống hiển thị.";
        });
    }

    public override async Task HandleAsync(DeleteAdminPlaceRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminPlaceCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
