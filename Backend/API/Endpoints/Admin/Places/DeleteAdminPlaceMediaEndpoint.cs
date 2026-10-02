using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Places;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Places;

public class DeleteAdminPlaceMediaRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    [BindFrom("mediaId")]
    public long MediaId { get; set; }
}

public class DeleteAdminPlaceMediaEndpoint : Endpoint<DeleteAdminPlaceMediaRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/places/{id}/media/{mediaId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xóa ảnh khỏi bộ sưu tập địa điểm (Admin)";
            s.Description = "Xóa ảnh khỏi bảng PlaceMedia và dọn dẹp trên máy chủ Azure Blob.";
        });
    }

    public override async Task HandleAsync(DeleteAdminPlaceMediaRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminPlaceMediaCommand(req.Id, req.MediaId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
