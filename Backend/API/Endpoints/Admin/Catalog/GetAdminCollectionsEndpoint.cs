using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Catalog.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class GetAdminCollectionsEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<CollectionDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/collections");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bộ sưu tập địa điểm (Admin)";
            s.Description = "Danh sách các bộ sưu tập địa điểm tuyển chọn.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetFeaturedCollectionsQuery(Count: 50), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
