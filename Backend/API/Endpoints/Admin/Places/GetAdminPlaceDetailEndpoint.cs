using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Places;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Places;

public class GetAdminPlaceDetailRequest
{
    public long Id { get; set; }
}

public class GetAdminPlaceDetailEndpoint : Endpoint<GetAdminPlaceDetailRequest, ApiSuccessResponse<AdminPlaceDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/places/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết địa điểm quản trị (Admin)";
            s.Description = "Lấy thông tin chi tiết toàn diện của địa điểm bao gồm toạ độ Mapbox, media, giờ mở cửa.";
        });
    }

    public override async Task HandleAsync(GetAdminPlaceDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminPlaceDetailQuery(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
