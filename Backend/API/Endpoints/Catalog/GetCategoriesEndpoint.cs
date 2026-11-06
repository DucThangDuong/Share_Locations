using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Catalog.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Catalog;

public class GetCategoriesEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<CategoryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/categories");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh mục phân loại địa điểm hệ thống";
            s.Description = "Danh sách danh mục địa điểm phân loại chi tiết đồng bộ giữa trang người dùng và quản trị.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCategoriesQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}

