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
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetAdminProposalsEndpoint : Endpoint<GetAdminProposalsRequest, ApiSuccessResponse<IReadOnlyList<AdminProposalDto>>>
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
            s.Description = "Danh sách các đề xuất tạo mới địa điểm hoặc cập nhật thông tin địa điểm từ người dùng.";
        });
    }

    public override async Task HandleAsync(GetAdminProposalsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminProposalsQuery(
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
