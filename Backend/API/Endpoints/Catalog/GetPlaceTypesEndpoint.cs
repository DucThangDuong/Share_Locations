using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Catalog.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Catalog;

public class GetPlaceTypesEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<PlaceTypeDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/place-types", "/api/place-types");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách loại hình và danh mục địa điểm";
            s.Description = "Lấy danh mục phân cấp các loại hình địa điểm (du lịch, ẩm thực, lưu trú, giải trí) kèm các danh mục con tương ứng.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetPlaceTypesQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
