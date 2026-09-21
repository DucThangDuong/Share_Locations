using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Reviews;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Reviews;

public class UpdateAdminReviewStatusRequest : UpdateEntityStatusInput
{
    public long Id { get; set; }
}

public class UpdateAdminReviewStatusEndpoint : Endpoint<UpdateAdminReviewStatusRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/admin/reviews/{id}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Ẩn hoặc Hiện đánh giá địa điểm (Admin)";
            s.Description = "Chuyển đổi trạng thái ẩn (hidden) hoặc công khai (active) của đánh giá.";
        });
    }

    public override async Task HandleAsync(UpdateAdminReviewStatusRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateAdminReviewStatusCommand(req.Id, req.Status), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
