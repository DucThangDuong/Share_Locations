using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Admin.Catalog.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class CreateAdminCollectionRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ProvinceId { get; set; }
    public string? CoverUrl { get; set; }
    public int? DisplayOrder { get; set; }
    public bool IsFeatured { get; set; } = false;
    public int? Status { get; set; } = 1;
    public List<CollectionPlaceInputDto>? Places { get; set; }
    public List<long>? PlaceIds { get; set; }
}

public class CreateAdminCollectionEndpoint : Endpoint<CreateAdminCollectionRequest, ApiSuccessResponse<AdminCollectionCreatedDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/collections");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Tạo mới bộ sưu tập (Admin)";
            s.Description = "Tạo mới bộ sưu tập tuyển chọn, kèm theo danh sách các địa điểm ban đầu nếu có.";
        });
    }

    public override async Task HandleAsync(CreateAdminCollectionRequest req, CancellationToken ct)
    {
        var places = req.Places ?? new List<CollectionPlaceInputDto>();
        if (places.Count == 0 && req.PlaceIds != null && req.PlaceIds.Count > 0)
        {
            int order = 1;
            places = req.PlaceIds.Where(id => id > 0).Select(id => new CollectionPlaceInputDto
            {
                PlaceId = id,
                DisplayOrder = order++
            }).ToList();
        }

        var command = new CreateAdminCollectionCommand(
            req.Title,
            req.Description,
            req.ProvinceId,
            req.CoverUrl,
            req.DisplayOrder,
            req.IsFeatured,
            req.Status,
            places);

        var result = await Mediator.Send(command, ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
