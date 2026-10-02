using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Catalog.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class UpdateCollectionPlacesRequest
{
    public int CollectionId { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? ProvinceId { get; set; }
    public List<CollectionPlaceInputDto> Places { get; set; } = new();
    public bool ReplaceExisting { get; set; } = false;
}

public class UpdateAdminCollectionPlacesEndpoint : Endpoint<UpdateCollectionPlacesRequest, ApiSuccessResponse<UpdateCollectionPlacesResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/collections/{collectionId}/places");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Thêm / cập nhật danh sách địa điểm và thông tin bộ sưu tập (Admin)";
            s.Description = "Cập nhật danh sách địa điểm, tỉnh/thành (provinceId), tiêu đề (title) và mô tả (description) vào bộ sưu tập: hỗ trợ thêm mới/cập nhật (replaceExisting = false) hoặc ghi đè toàn bộ danh sách (replaceExisting = true).";
        });
    }

    public override async Task HandleAsync(UpdateCollectionPlacesRequest req, CancellationToken ct)
    {
        if (req.CollectionId <= 0)
        {
            await this.SendApiResponseAsync(
                Result<UpdateCollectionPlacesResultDto>.Failure("Mã bộ sưu tập (CollectionId) không hợp lệ."),
                ct);
            return;
        }

        var placesInput = req.Places?
            .Where(p => p.PlaceId > 0)
            .ToList() ?? new List<CollectionPlaceInputDto>();

        for (int i = 0; i < placesInput.Count; i++)
        {
            if (placesInput[i].DisplayOrder <= 0)
            {
                placesInput[i].DisplayOrder = i + 1;
            }
        }

        if (placesInput.Count == 0 && !req.ReplaceExisting && req.Description == null && !req.ProvinceId.HasValue && string.IsNullOrWhiteSpace(req.Title))
        {
            await this.SendApiResponseAsync(
                Result<UpdateCollectionPlacesResultDto>.Failure("Vui lòng cung cấp ít nhất một địa điểm hợp lệ hoặc thông tin cần cập nhật."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new UpdateCollectionPlacesCommand(
                req.CollectionId,
                placesInput,
                req.ReplaceExisting,
                req.Description,
                req.ProvinceId,
                req.Title),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
