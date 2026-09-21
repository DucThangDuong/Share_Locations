using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Reviews;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Reviews;

public class DeleteAdminReviewRequest
{
    public long Id { get; set; }
}

public class DeleteAdminReviewEndpoint : Endpoint<DeleteAdminReviewRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/reviews/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xóa vĩnh viễn đánh giá vi phạm (Admin)";
            s.Description = "Xóa đánh giá khỏi hệ thống và tự động tính toán lại điểm rating trung bình của quán.";
        });
    }

    public override async Task HandleAsync(DeleteAdminReviewRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminReviewCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
