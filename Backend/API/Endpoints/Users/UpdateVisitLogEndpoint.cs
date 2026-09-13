using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class UpdateVisitLogRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    [FromBody]
    public UpdateVisitLogRequestDto Body { get; set; } = null!;
}

public class UpdateVisitLogEndpoint : Endpoint<UpdateVisitLogRequest>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/v1/users/me/visit-logs/{id}", "/api/users/me/visit-logs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Cập nhật nhật ký hành trình";
            s.Description = "Cập nhật ngày ghé thăm hoặc trạng thái riêng tư của bản ghi nhật ký hành trình.";
        });
    }

    public override async Task HandleAsync(UpdateVisitLogRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thao tác."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new UpdateVisitLogCommand(req.Id, userId.Value, req.Body.VisitedDate, req.Body.Privacy),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
