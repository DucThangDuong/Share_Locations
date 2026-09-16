using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class InviteTripMemberRequest
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Member";
}

public class InviteTripMemberEndpoint : Endpoint<InviteTripMemberRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/v1/trips/{id}/members");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Mời thành viên vào chuyến đi";
            s.Description = "Chủ sở hữu mời người dùng khác tham gia chuyến đi qua địa chỉ email và gán vai trò (Editor hoặc Member).";
        });
    }

    public override async Task HandleAsync(InviteTripMemberRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để thực hiện thao tác này."),
                ct);
            return;
        }

        var dto = new InviteTripMemberRequestDto
        {
            Email = req.Email,
            Role = req.Role
        };

        var result = await Mediator.Send(new InviteTripMemberCommand(req.Id, userId.Value, dto), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
