using API.DTOs;
using API.DTOs.Auth;
using API.Extensions;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class ResetPasswordEndpoint : Endpoint<ResetPasswordRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/auth/reset-password");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth_strict"));
        Summary(s =>
        {
            s.Summary = "Bước 3: Đặt lại mật khẩu bằng ResetToken";
            s.Description = "Xác thực ResetToken từ Redis, cập nhật mật khẩu mới và hủy ResetToken.";
        });
    }

    public override async Task HandleAsync(ResetPasswordRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new ResetPasswordCommand(req.ResetToken, req.NewPassword), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
