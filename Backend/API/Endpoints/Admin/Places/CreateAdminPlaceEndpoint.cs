using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Places;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Places;

public class CreateAdminPlaceEndpoint : Endpoint<CreateAdminPlaceInput, ApiSuccessResponse<long>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/places");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Tạo mới địa điểm du lịch (Admin)";
            s.Description = "Thêm mới một địa điểm vào hệ thống với toạ độ GPS, giờ hoạt động và mức giá.";
        });
    }

    public override async Task HandleAsync(CreateAdminPlaceInput req, CancellationToken ct)
    {
        var adminId = this.GetUserId();
        var result = await Mediator.Send(new CreateAdminPlaceCommand(req, adminId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
