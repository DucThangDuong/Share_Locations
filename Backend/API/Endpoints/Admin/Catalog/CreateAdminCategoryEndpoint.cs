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

public class CreateAdminCategoryApiRequest : CreateAdminCategoryRequest
{
    public IFormFile? File { get; set; }
    public IFormFile? Image { get; set; }
    public IFormFile? ImageFile { get; set; }
}

public class CreateAdminCategoryEndpoint : Endpoint<CreateAdminCategoryApiRequest, ApiSuccessResponse<int>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/catalog/categories");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Thêm mới Danh mục chi tiết (Admin)";
            s.Description = "Tạo thêm danh mục địa điểm mới vào hệ thống, hỗ trợ tải ảnh trực tiếp lên Azure Blob Storage.";
        });
    }

    public override async Task HandleAsync(CreateAdminCategoryApiRequest req, CancellationToken ct)
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

        var result = await Mediator.Send(new CreateAdminCategoryCommand(req, imageFile), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
