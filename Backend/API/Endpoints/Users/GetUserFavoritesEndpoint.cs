using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Users;

public class GetUserFavoritesRequest
{
    [QueryParam]
    public int? TargetType { get; set; }

    [QueryParam]
    public string? Keyword { get; set; }

    [QueryParam]
    public string? SortBy { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 12;
}

public class GetUserFavoritesEndpoint : Endpoint<GetUserFavoritesRequest, ApiSuccessResponse<UserFavoritePagedResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/users/me/favorites", "/api/users/me/favorites");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách mục đã lưu của tôi";
            s.Description = "Lấy danh sách địa điểm, món ăn, lịch trình và bài viết blog mà người dùng hiện tại đã lưu yêu thích.";
        });
    }

    public override async Task HandleAsync(GetUserFavoritesRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserFavoritePagedResultDto>.Unauthorized("Bạn cần đăng nhập để xem danh sách yêu thích."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserFavoritesQuery(
                userId.Value,
                req.TargetType,
                req.Keyword,
                req.SortBy,
                req.Page,
                req.PageSize),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
