using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.DTOs.Admin;
using Application.Features.Admin.Foods;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;

namespace API.Endpoints.Admin.Foods;

public class CreateAdminFoodRequest : CreateAdminFoodInput
{
    public IFormFile? File { get; set; }
    public IFormFile? Image { get; set; }
    public IFormFile? CoverImage { get; set; }
}

public class CreateAdminFoodEndpoint : Endpoint<CreateAdminFoodRequest, ApiSuccessResponse<long>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/foods");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Tạo mới món ăn đặc sản (Admin)";
            s.Description = "Thêm mới món ăn đặc sản vào hệ thống kèm theo tỉnh thành, mức giá và hình ảnh (lưu trữ trên Azure Blob). Hỗ trợ upload tệp hình ảnh trực tiếp (multipart/form-data) hoặc đường dẫn / Base64.";
        });
    }

    public override async Task HandleAsync(CreateAdminFoodRequest req, CancellationToken ct)
    {
        FileUploadModel? imageFile = null;
        var file = req.File ?? req.Image ?? req.CoverImage;

        if (file == null && HttpContext.Request.HasFormContentType && HttpContext.Request.Form.Files.Count > 0)
        {
            file = HttpContext.Request.Form.Files["coverImg"]
                ?? HttpContext.Request.Form.Files["coverImage"]
                ?? HttpContext.Request.Form.Files["image"]
                ?? HttpContext.Request.Form.Files["file"]
                ?? HttpContext.Request.Form.Files[0];
        }

        if (file != null && file.Length > 0)
        {
            imageFile = new FileUploadModel(
                file.OpenReadStream(),
                file.FileName,
                file.ContentType);
        }

        var result = await Mediator.Send(new CreateAdminFoodCommand(req, imageFile), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}

