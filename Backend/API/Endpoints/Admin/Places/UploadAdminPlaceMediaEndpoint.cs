using System.Security.Claims;
using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.DTOs.Admin;
using Application.Features.Admin.Places;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;

namespace API.Endpoints.Admin.Places;

public class UploadAdminPlaceMediaRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    public List<IFormFile>? Files { get; set; }
    public IFormFile? File { get; set; }
}

public class UploadAdminPlaceMediaEndpoint : Endpoint<UploadAdminPlaceMediaRequest, ApiSuccessResponse<List<PlaceMediaItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/places/{id}/media");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Tải ảnh lên bộ sưu tập của địa điểm (Admin)";
            s.Description = "Tải một hoặc nhiều hình ảnh lên Azure Blob và lưu vào bảng PlaceMedia.";
        });
    }

    public override async Task HandleAsync(UploadAdminPlaceMediaRequest req, CancellationToken ct)
    {
        var filesToProcess = new List<IFormFile>();
        if (req.Files != null && req.Files.Count > 0)
        {
            filesToProcess.AddRange(req.Files);
        }
        else if (req.File != null)
        {
            filesToProcess.Add(req.File);
        }
        else if (HttpContext.Request.HasFormContentType && HttpContext.Request.Form.Files.Count > 0)
        {
            filesToProcess.AddRange(HttpContext.Request.Form.Files);
        }

        if (filesToProcess.Count == 0)
        {
            await this.SendApiResponseAsync(
                Result<List<PlaceMediaItemDto>>.Failure("Vui lòng chọn ít nhất một hình ảnh để tải lên."),
                ct);
            return;
        }

        long? uploaderId = null;
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (long.TryParse(userIdStr, out var parsedId))
        {
            uploaderId = parsedId;
        }

        var fileUploadModels = new List<FileUploadModel>();
        foreach (var f in filesToProcess)
        {
            fileUploadModels.Add(new FileUploadModel(f.OpenReadStream(), f.FileName, f.ContentType));
        }

        try
        {
            var command = new UploadAdminPlaceMediaCommand(req.Id, fileUploadModels, uploaderId);
            var result = await Mediator.Send(command, ct);
            await this.SendApiResponseAsync(result, ct);
        }
        finally
        {
            foreach (var fum in fileUploadModels)
            {
                fum.Content?.Dispose();
            }
        }
    }
}
