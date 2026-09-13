using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class GetUserReviewsRequest
{
    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 10;
}

public class GetUserReviewsEndpoint : Endpoint<GetUserReviewsRequest, ApiSuccessResponse<IReadOnlyList<UserReviewItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/reviews", "/api/users/me/reviews");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách đánh giá của tôi";
            s.Description = "Lấy danh sách các bài đánh giá địa điểm mà người dùng hiện tại đã viết.";
        });
    }

    public override async Task HandleAsync(GetUserReviewsRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<PagedResult<UserReviewItemDto>>.Unauthorized("Bạn cần đăng nhập để xem đánh giá."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserReviewsQuery(userId.Value, req.Page, req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
