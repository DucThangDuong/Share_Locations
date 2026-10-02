using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Admin.Catalog.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class GetAdminCollectionPlacesRequest
{
    public int CollectionId { get; set; }
    public int? Id { get; set; }
}

public class GetAdminCollectionPlacesEndpoint : Endpoint<GetAdminCollectionPlacesRequest, ApiSuccessResponse<AdminCollectionDetailPlacesDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/collections/{collectionId}/places");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết bộ sưu tập kèm danh sách địa điểm (Admin)";
            s.Description = "Lấy chi tiết bộ sưu tập (tiêu đề, mô tả description, tỉnh thành, ảnh bìa) kèm danh sách các địa điểm thuộc bộ sưu tập.";
        });
    }

    public override async Task HandleAsync(GetAdminCollectionPlacesRequest req, CancellationToken ct)
    {
        int targetCollectionId = req.CollectionId > 0 ? req.CollectionId : (req.Id ?? 0);
        if (targetCollectionId <= 0)
        {
            await this.SendApiResponseAsync(
                Result<AdminCollectionDetailPlacesDto>.Failure("Mã bộ sưu tập (CollectionId) không hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(new GetAdminCollectionPlacesQuery(targetCollectionId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
