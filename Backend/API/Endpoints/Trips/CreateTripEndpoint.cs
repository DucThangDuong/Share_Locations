using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class CreateTripEndpoint : Endpoint<CreateTripRequestDto, ApiSuccessResponse<CreateTripResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Tạo mới hoặc áp dụng chuyến đi từ mẫu";
            s.Description = "Tạo chuyến đi cá nhân mới hoặc nhân bản toàn bộ cấu trúc từ chuyến đi mẫu có sẵn (sourceTripId).";
        });
    }

    public override async Task HandleAsync(CreateTripRequestDto req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<CreateTripResponseDto>.Unauthorized("Bạn cần đăng nhập để tạo chuyến đi."),
                ct);
            return;
        }

        var result = await Mediator.Send(new CreateTripCommand(userId.Value, req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
