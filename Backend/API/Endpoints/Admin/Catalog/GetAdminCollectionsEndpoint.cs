using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Admin.Catalog.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class GetAdminCollectionsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<AdminCollectionSummaryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/collections");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách tổng quan bộ sưu tập địa điểm (Admin)";
            s.Description = "Danh sách tổng quan các bộ sưu tập địa điểm tuyển chọn kèm tên tỉnh thành, số lượng địa điểm (không kèm chi tiết địa điểm).";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminCollectionsQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
