using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Reviews;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Reviews;

public class GetAdminReviewsRequest
{
    public bool? HasReportsOnly { get; set; }
    public int? Rating { get; set; }
    public string? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetAdminReviewsEndpoint : Endpoint<GetAdminReviewsRequest, ApiSuccessResponse<IReadOnlyList<AdminReviewItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/reviews");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách đánh giá địa điểm (Admin)";
            s.Description = "Danh sách đánh giá địa điểm phục vụ kiểm duyệt, có hỗ trợ lọc chỉ lấy đánh giá có phản ánh vi phạm.";
        });
    }

    public override async Task HandleAsync(GetAdminReviewsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminReviewsQuery(
                req.HasReportsOnly,
                req.Rating,
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
