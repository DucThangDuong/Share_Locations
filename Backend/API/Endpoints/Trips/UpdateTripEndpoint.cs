using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Trips.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Trips;

public class UpdateTripRequest
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public byte? Privacy { get; set; }
    public decimal? BudgetTarget { get; set; }
}

public class UpdateTripEndpoint : Endpoint<UpdateTripRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/trips/{id}");
        Tags("Trips");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Cập nhật thông tin chuyến đi";
            s.Description = "Cập nhật tiêu đề, mô tả, ảnh bìa, ngày đi, ngày về hoặc chế độ riêng tư của chuyến đi.";
        });
    }

    public override async Task HandleAsync(UpdateTripRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result.Unauthorized("Bạn cần đăng nhập để chỉnh sửa chuyến đi."),
                ct);
            return;
        }

        var dto = new UpdateTripRequestDto
        {
            Title = req.Title,
            Description = req.Description,
            CoverImageUrl = req.CoverImageUrl,
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            Privacy = req.Privacy,
            BudgetTarget = req.BudgetTarget
        };

        var result = await Mediator.Send(new UpdateTripCommand(req.Id, userId.Value, dto), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
