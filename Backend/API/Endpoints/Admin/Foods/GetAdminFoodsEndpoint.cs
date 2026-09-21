using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Foods;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Foods;

public class GetAdminFoodsRequest
{
    public int? ProvinceId { get; set; }
    public string? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetAdminFoodsEndpoint : Endpoint<GetAdminFoodsRequest, ApiSuccessResponse<IReadOnlyList<AdminFoodItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/foods");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách món ăn đặc sản (Admin)";
            s.Description = "Danh sách món ăn đặc sản vùng miền phục vụ quản trị danh mục.";
        });
    }

    public override async Task HandleAsync(GetAdminFoodsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminFoodsQuery(
                req.ProvinceId,
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
