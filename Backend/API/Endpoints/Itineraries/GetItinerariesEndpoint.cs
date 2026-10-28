using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using API.DTOs;
using API.DTOs.Itineraries;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Itineraries.Queries;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Itineraries;

public class GetItinerariesEndpoint : Endpoint<GetItinerariesRequest, ApiSuccessResponse<IReadOnlyList<ItineraryDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/itineraries");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách lịch trình du lịch công khai";
            s.Description = "Lấy danh sách các lịch trình du lịch gợi ý công khai kèm tìm kiếm theo điểm đến (destination), thời lượng (duration), khoảng giá (budget), từ khóa (keyword/q) và phân trang.";
        });
    }

    public override async Task HandleAsync(GetItinerariesRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;

        long? currentUserId = long.TryParse(userIdStr, out var parsedId) ? parsedId : null;

        var filterParams = new ItineraryFilterParams
        {
            Destination = req.Destination,
            Duration = req.Duration,
            Budget = req.Budget,
            Keyword = req.GetEffectiveKeyword(),
            Page = req.Page,
            PageSize = req.PageSize,
            UserId = currentUserId
        };

        var result = await Mediator.Send(new GetItinerariesQuery(filterParams), ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
