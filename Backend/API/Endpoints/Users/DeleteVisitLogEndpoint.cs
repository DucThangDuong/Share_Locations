using API.Extensions;
using Application.Common;
using Application.Features.Users.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class DeleteVisitLogRequest
{
    [BindFrom("id")]
    public long Id { get; set; }
}

public class DeleteVisitLogEndpoint : Endpoint<DeleteVisitLogRequest>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/v1/users/me/visit-logs/{id}", "/api/users/me/visit-logs/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa nhật ký hành trình";
            s.Description = "Xóa một địa điểm đã lưu trong nhật ký hành trình cá nhân.";
        });
    }

    public override async Task HandleAsync(DeleteVisitLogRequest req, CancellationToken ct)
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
            new DeleteVisitLogCommand(req.Id, userId.Value),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
