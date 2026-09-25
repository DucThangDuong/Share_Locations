using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Users;

public class GetUserBlogsRequest
{
    public string? UserId { get; set; }

    [QueryParam]
    public int? Status { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 15;
}

public class GetUserBlogsEndpoint : Endpoint<GetUserBlogsRequest, ApiSuccessResponse<IReadOnlyList<UserBlogItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/{UserId}/blogs");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bài viết blog của người dùng";
            s.Description = "Lấy danh sách các bài viết cẩm nang du lịch do người dùng biên tập (hỗ trợ xem của chính mình hoặc người khác).";
        });
    }

    public override async Task HandleAsync(GetUserBlogsRequest req, CancellationToken ct)
    {
        var currentUserId = this.GetUserId();
        long targetUserId;

        if (string.IsNullOrWhiteSpace(req.UserId) || string.Equals(req.UserId, "me", StringComparison.OrdinalIgnoreCase))
        {
            if (!currentUserId.HasValue)
            {
                await this.SendApiResponseAsync(
                    Result<PagedResult<UserBlogItemDto>>.Unauthorized("Bạn cần đăng nhập để xem bài viết của mình."),
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
                Result<PagedResult<UserBlogItemDto>>.Failure("Mã người dùng không hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserBlogsQuery(targetUserId, currentUserId, req.Status, req.Page, req.PageSize),
            ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
