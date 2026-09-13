using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class GetUserCommentsRequest
{
    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 10;
}

public class GetUserCommentsEndpoint : Endpoint<GetUserCommentsRequest, ApiSuccessResponse<IReadOnlyList<UserCommentItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/comments", "/api/users/me/comments");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bình luận của tôi";
            s.Description = "Lấy danh sách các bình luận mà người dùng hiện tại đã đăng trên các bài đánh giá.";
        });
    }

    public override async Task HandleAsync(GetUserCommentsRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<PagedResult<UserCommentItemDto>>.Unauthorized("Bạn cần đăng nhập để xem bình luận."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserCommentsQuery(userId.Value, req.Page, req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
