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

public class UpdateAdminFoodRequest : UpdateAdminFoodInput
{
    public long Id { get; set; }
    public IFormFile? File { get; set; }
    public IFormFile? Image { get; set; }
    public IFormFile? CoverImage { get; set; }
}

public class UpdateAdminFoodEndpoint : Endpoint<UpdateAdminFoodRequest, ApiSuccessResponse<AdminFoodUpdatedResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/foods/{id}");
        Post("/api/admin/foods/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Cập nhật món ăn đặc sản (Admin)";
            s.Description = "Cập nhật thông tin chi tiết, giá tiền, tỉnh thành và hình ảnh của món ăn. Hỗ trợ upload tệp hình ảnh trực tiếp (multipart/form-data) hoặc đường dẫn / Base64 tải lên Azure Blob Storage.";
        });
    }

    public override async Task HandleAsync(UpdateAdminFoodRequest req, CancellationToken ct)
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

        var result = await Mediator.Send(new UpdateAdminFoodCommand(req.Id, req, imageFile), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}

