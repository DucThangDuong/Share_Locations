using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Users;

public class GetUserReviewsRequest
{
    public string? UserId { get; set; }

    [QueryParam]
    public string? SortBy { get; set; } = "newest";

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 15;
}

public class GetUserReviewsEndpoint : Endpoint<GetUserReviewsRequest, ApiSuccessResponse<IReadOnlyList<UserReviewItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/{UserId}/reviews");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách đánh giá của người dùng";
            s.Description = "Lấy danh sách các bài đánh giá địa điểm của người dùng (hỗ trợ xem của chính mình hoặc người khác).";
        });
    }

    public override async Task HandleAsync(GetUserReviewsRequest req, CancellationToken ct)
    {
        var currentUserId = this.GetUserId();
        long targetUserId;

        if (string.IsNullOrWhiteSpace(req.UserId) || string.Equals(req.UserId, "me", StringComparison.OrdinalIgnoreCase))
        {
            if (!currentUserId.HasValue)
            {
                await this.SendApiResponseAsync(
                    Result<PagedResult<UserReviewItemDto>>.Unauthorized("Bạn cần đăng nhập để xem đánh giá của mình."),
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
                Result<PagedResult<UserReviewItemDto>>.Failure("Mã người dùng không hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserReviewsQuery(targetUserId, currentUserId, req.SortBy, req.Page, req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
