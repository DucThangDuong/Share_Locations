using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Proposals;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Proposals;

public class GetAdminProposalDetailRequest
{
    public long Id { get; set; }
}

public class GetAdminProposalDetailEndpoint : Endpoint<GetAdminProposalDetailRequest, ApiSuccessResponse<AdminProposalDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/proposals/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy chi tiết đề xuất đóng góp (Admin)";
            s.Description = "Xem thông tin chi tiết dữ liệu đề xuất từ người dùng để đối soát và phê duyệt.";
        });
    }

    public override async Task HandleAsync(GetAdminProposalDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminProposalDetailQuery(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
