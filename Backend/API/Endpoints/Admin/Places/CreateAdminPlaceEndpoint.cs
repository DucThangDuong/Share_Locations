using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
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
        AllowFileUploads();
        Summary(s =>
        {
            s.Summary = "Tạo mới địa điểm du lịch (Admin)";
            s.Description = "Thêm mới một địa điểm trực tiếp vào hệ thống (tự động duyệt, không qua đề xuất). Hỗ trợ cả application/json (Base64/URL ảnh) và multipart/form-data (upload file ảnh trực tiếp lên Azure Blob Storage).";
        });
    }

    public override async Task HandleAsync(CreateAdminPlaceInput req, CancellationToken ct)
    {
        FileUploadModel? coverFile = null;
        var mediaFiles = new List<FileUploadModel>();

        if (HttpContext.Request.HasFormContentType)
        {
            var form = HttpContext.Request.Form;
            if (form.TryGetValue("latitude", out var latStr) &&
                decimal.TryParse(latStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedLat))
            {
                req.Latitude = parsedLat;
            }
            if (form.TryGetValue("longitude", out var lngStr) &&
                decimal.TryParse(lngStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedLng))
            {
                req.Longitude = parsedLng;
            }
            if (form.TryGetValue("minPrice", out var minStr) &&
                decimal.TryParse(minStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedMin))
            {
                req.MinPrice = parsedMin;
            }
            if (form.TryGetValue("maxPrice", out var maxStr) &&
                decimal.TryParse(maxStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedMax))
            {
                req.MaxPrice = parsedMax;
            }

            var incomingCover = form.Files["coverImage"]
                             ?? form.Files["coverImg"]
                             ?? form.Files["primaryImage"]
                             ?? form.Files["primaryImageUrl"];

            if (incomingCover != null && incomingCover.Length > 0)
            {
                coverFile = new FileUploadModel(
                    incomingCover.OpenReadStream(),
                    incomingCover.FileName,
                    incomingCover.ContentType);
            }

            var extraFiles = form.Files.GetFiles("photos");
            if (extraFiles.Count == 0) extraFiles = form.Files.GetFiles("images");
            if (extraFiles.Count == 0) extraFiles = form.Files.GetFiles("mediaFiles");

            foreach (var file in extraFiles)
            {
                if (file.Length > 0 && file != incomingCover)
                {
                    mediaFiles.Add(new FileUploadModel(
                        file.OpenReadStream(),
                        file.FileName,
                        file.ContentType));
                }
            }
        }

        var adminId = this.GetUserId();
        var result = await Mediator.Send(new CreateAdminPlaceCommand(req, adminId, coverFile, mediaFiles), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
