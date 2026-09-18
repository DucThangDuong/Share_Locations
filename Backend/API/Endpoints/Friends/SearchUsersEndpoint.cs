using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Friends.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Friends;

public class SearchUsersRequest
{
    [QueryParam]
    public string? Q { get; set; }

    [QueryParam]
    public string? Keyword { get; set; }

    public string SearchTerm => !string.IsNullOrWhiteSpace(Q) ? Q : (Keyword ?? string.Empty);
}

public class SearchUsersEndpoint : Endpoint<SearchUsersRequest, ApiSuccessResponse<List<FriendItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/users/search", "/api/friends/search");
        Tags("Friends");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Tìm kiếm người dùng";
            s.Description = "Tìm kiếm người dùng theo tên, email hoặc ID (bắt đầu bằng #).";
        });
    }

    public override async Task HandleAsync(SearchUsersRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        var result = await Mediator.Send(new SearchUsersQuery(userId, req.SearchTerm), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
