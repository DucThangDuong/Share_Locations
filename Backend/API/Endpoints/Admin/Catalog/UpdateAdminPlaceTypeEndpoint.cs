using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.DTOs.Admin;
using Application.Features.Admin.Catalog;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;

namespace API.Endpoints.Admin.Catalog;

public class UpdateAdminPlaceTypeApiRequest : UpdateAdminPlaceTypeRequest
{
    public int Id { get; set; }
    public IFormFile? File { get; set; }
    public IFormFile? Image { get; set; }
    public IFormFile? ImageFile { get; set; }
}

public class UpdateAdminPlaceTypeEndpoint : Endpoint<UpdateAdminPlaceTypeApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/catalog/place-types/{id}");
        Post("/api/admin/catalog/place-types/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Cập nhật Loại địa điểm lớn (Admin)";
            s.Description = "Chỉnh sửa thông tin loại địa điểm, hỗ trợ tải ảnh đại diện lên Azure Blob Storage (multipart/form-data hoặc base64).";
        });
    }

    public override async Task HandleAsync(UpdateAdminPlaceTypeApiRequest req, CancellationToken ct)
    {
        FileUploadModel? imageFile = null;
        var file = req.File ?? req.Image ?? req.ImageFile;

        if (file == null && HttpContext.Request.HasFormContentType && HttpContext.Request.Form.Files.Count > 0)
        {
            file = HttpContext.Request.Form.Files["image"]
                ?? HttpContext.Request.Form.Files["file"]
                ?? HttpContext.Request.Form.Files["imageFile"]
                ?? HttpContext.Request.Form.Files["imageUrl"]
                ?? HttpContext.Request.Form.Files[0];
        }

        if (file != null && file.Length > 0)
        {
            imageFile = new FileUploadModel(
                file.OpenReadStream(),
                file.FileName,
                file.ContentType);
        }

        var result = await Mediator.Send(new UpdateAdminPlaceTypeCommand(req.Id, req, imageFile), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
