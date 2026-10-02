using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Proposals;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Proposals;

public class GetAdminProposalsRequest
{
    public int? Status { get; set; }
    public string? Keyword { get; set; }
    public string? Search
    {
        get => Keyword;
        set => Keyword = value ?? Keyword;
    }
    public int? ProvinceId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetAdminProposalsEndpoint : Endpoint<GetAdminProposalsRequest, ApiSuccessResponse<IReadOnlyList<AdminProposalSummaryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/proposals");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách đề xuất đóng góp cộng đồng (Admin)";
            s.Description = "Danh sách các đề xuất tạo mới hoặc cập nhật thông tin địa điểm với bộ đếm trạng thái chi tiết.";
        });
    }

    public override async Task HandleAsync(GetAdminProposalsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminProposalsQuery(
                req.Status,
                req.Keyword ?? req.Search,
                req.ProvinceId,
                req.Page,
                req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
