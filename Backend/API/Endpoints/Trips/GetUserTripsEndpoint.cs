using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Trips;

public class GetUserTripsRequest
{
    public string? UserId { get; set; }

    [QueryParam]
    public string? Status { get; set; } = "all";

    [QueryParam]
    public byte? Privacy { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 15;
}

public class GetUserTripsEndpoint : Endpoint<GetUserTripsRequest, ApiSuccessResponse<IReadOnlyList<UserTripSummaryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/{UserId}/trips");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách chuyến đi của người dùng";
            s.Description = "Lấy danh sách các chuyến đi do người dùng tạo hoặc tham gia làm thành viên (hỗ trợ xem của chính mình hoặc người khác).";
        });
    }

    public override async Task HandleAsync(GetUserTripsRequest req, CancellationToken ct)
    {
        var currentUserId = this.GetUserId();
        long targetUserId;

        if (string.IsNullOrWhiteSpace(req.UserId) || string.Equals(req.UserId, "me", StringComparison.OrdinalIgnoreCase))
        {
            if (!currentUserId.HasValue)
            {
                await this.SendApiResponseAsync(
                    Result<PagedResult<UserTripSummaryDto>>.Unauthorized("Bạn cần đăng nhập để xem danh sách chuyến đi của mình."),
                    ct);
                return;
            }
            targetUserId = currentUserId.Value;
        }
        else if (long.TryParse(req.UserId, out var parsedId))
        {
            targetUserId = parsedId;
        }
        else
        {
            await this.SendApiResponseAsync(
                Result<PagedResult<UserTripSummaryDto>>.Failure("Mã người dùng không hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserTripsQuery(targetUserId, currentUserId, req.Status, req.Privacy, req.Page, req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
