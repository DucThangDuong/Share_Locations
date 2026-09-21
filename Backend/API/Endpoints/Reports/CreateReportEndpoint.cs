using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Reports;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Reports;

public class CreateReportEndpoint : Endpoint<CreateReportInput, ApiSuccessResponse<long>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/reports");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Gửi báo cáo vi phạm nội dung";
            s.Description = "Gửi báo cáo vi phạm cho địa điểm, đánh giá, bình luận hoặc bài viết blog.";
        });
    }

    public override async Task HandleAsync(CreateReportInput req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result<long>.Unauthorized("Bạn cần đăng nhập để gửi báo cáo vi phạm."), ct);
            return;
        }

        var result = await Mediator.Send(
            new CreateReportCommand(
                req.TargetType,
                req.TargetId,
                req.ReasonId,
                req.Description,
                userId.Value),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
