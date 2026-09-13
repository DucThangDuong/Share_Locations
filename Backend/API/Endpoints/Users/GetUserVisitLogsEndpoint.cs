using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class GetUserVisitLogsRequest
{
    [QueryParam]
    public int? Privacy { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 12;
}

public class GetUserVisitLogsEndpoint : Endpoint<GetUserVisitLogsRequest, ApiSuccessResponse<UserVisitLogPagedResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/visit-logs", "/api/users/me/visit-logs");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách nhật ký hành trình";
            s.Description = "Lấy danh sách các địa điểm người dùng đã check-in ghi nhớ trong nhật ký hành trình.";
        });
    }

    public override async Task HandleAsync(GetUserVisitLogsRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserVisitLogPagedResultDto>.Unauthorized("Bạn cần đăng nhập để xem nhật ký."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserVisitLogsQuery(userId.Value, req.Privacy, req.Page, req.PageSize),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
