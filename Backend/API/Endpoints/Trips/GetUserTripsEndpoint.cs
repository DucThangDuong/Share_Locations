using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class GetUserTripsRequest
{
    public string? Status { get; set; } = "all";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetUserTripsEndpoint : Endpoint<GetUserTripsRequest, ApiSuccessResponse<IReadOnlyList<UserTripSummaryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách chuyến đi của tôi";
            s.Description = "Lấy danh sách các chuyến đi do người dùng tạo hoặc tham gia làm thành viên.";
        });
    }

    public override async Task HandleAsync(GetUserTripsRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<PagedResult<UserTripSummaryDto>>.Unauthorized("Bạn cần đăng nhập để xem danh sách chuyến đi."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserTripsQuery(userId.Value, req.Status, req.Page, req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
