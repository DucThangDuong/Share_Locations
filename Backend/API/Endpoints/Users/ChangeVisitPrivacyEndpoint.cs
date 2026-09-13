using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class ChangeVisitPrivacyRequest
{
    [BindFrom("id")]
    public long Id { get; set; }

    [FromBody]
    public ChangeVisitPrivacyRequestDto Body { get; set; } = null!;
}

public class ChangeVisitPrivacyEndpoint : Endpoint<ChangeVisitPrivacyRequest>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/v1/users/me/visit-logs/{id}/privacy", "/api/users/me/visit-logs/{id}/privacy");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Chuyển nhanh quyền riêng tư nhật ký";
            s.Description = "Chuyển đổi quyền riêng tư của một bản ghi nhật ký giữa Công khai và Riêng tư.";
        });
    }

    public override async Task HandleAsync(ChangeVisitPrivacyRequest req, CancellationToken ct)
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
            new ChangeVisitPrivacyCommand(req.Id, userId.Value, req.Body.Privacy),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
