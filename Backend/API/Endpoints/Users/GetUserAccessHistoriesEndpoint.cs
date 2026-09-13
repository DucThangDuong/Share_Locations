using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class GetUserAccessHistoriesRequest
{
    [QueryParam]
    public int Limit { get; set; } = 10;
}

public class GetUserAccessHistoriesEndpoint : Endpoint<GetUserAccessHistoriesRequest, ApiSuccessResponse<IReadOnlyList<UserAccessHistoryItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/access-histories", "/api/users/me/access-histories");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy lịch sử xem địa điểm gần đây";
            s.Description = "Lấy danh sách các địa điểm người dùng đã xem gần đây (phục vụ thanh Dock điều hướng nhanh).";
        });
    }

    public override async Task HandleAsync(GetUserAccessHistoriesRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<IReadOnlyList<UserAccessHistoryItemDto>>.Unauthorized("Bạn cần đăng nhập để xem lịch sử."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserAccessHistoriesQuery(userId.Value, req.Limit),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
