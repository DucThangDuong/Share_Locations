using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Admin.Places;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;

namespace API.Endpoints.Admin.Places;

public class UpdateAdminPlaceCoverImageRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    public IFormFile? File { get; set; }
    public IFormFile? CoverImage { get; set; }
    public IFormFile? Image { get; set; }
}

public class PlaceCoverImageResponse
{
    public long Id { get; set; }
    public string CoverImageUrl { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class UpdateAdminPlaceCoverImageEndpoint : Endpoint<UpdateAdminPlaceCoverImageRequest, ApiSuccessResponse<PlaceCoverImageResponse>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/places/{id}/cover-image");
        Put("/api/admin/places/{id}/cover-image");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Cập nhật ảnh đại diện của địa điểm (Admin)";
            s.Description = "Tải ảnh mới lên Azure Blob Storage và cập nhật đường dẫn vào bảng Places.";
        });
    }

    public override async Task HandleAsync(UpdateAdminPlaceCoverImageRequest req, CancellationToken ct)
    {
        var file = req.File ?? req.CoverImage ?? req.Image;
        if (file == null && HttpContext.Request.HasFormContentType && HttpContext.Request.Form.Files.Count > 0)
        {
            file = HttpContext.Request.Form.Files[0];
        }

        if (file == null || file.Length == 0)
        {
            await this.SendApiResponseAsync(
                Result<PlaceCoverImageResponse>.Failure("Vui lòng chọn một tệp hình ảnh hợp lệ."),
                ct);
            return;
        }

        await using var stream = file.OpenReadStream();
        var fileUpload = new FileUploadModel(stream, file.FileName, file.ContentType);

        var result = await Mediator.Send(new UpdateAdminPlaceCoverImageCommand(req.Id, fileUpload), ct);

        if (!result.IsSuccess)
        {
            await this.SendApiResponseAsync(
                Result<PlaceCoverImageResponse>.Failure(result.Message, result.StatusCode, result.ErrorCode, result.Errors),
                ct);
            return;
        }

        var response = new PlaceCoverImageResponse
        {
            Id = req.Id,
            CoverImageUrl = result.Data!,
            Url = result.Data!
        };

        await this.SendApiResponseAsync(
            Result<PlaceCoverImageResponse>.Success(response, result.Message),
            ct);
    }
}
