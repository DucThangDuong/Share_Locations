using API.DTOs;
using API.DTOs.Auth;
using API.Extensions;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class ForgotPasswordEndpoint : Endpoint<ForgotPasswordRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/auth/forgot-password");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth_strict"));
        Summary(s =>
        {
            s.Summary = "Bước 1: Yêu cầu mã OTP quên mật khẩu";
            s.Description = "Kiểm tra email, sinh mã OTP 6 số lưu vào Redis (TTL 6 phút) và phát tán thông điệp RabbitMQ để Consumer ngầm gửi email.";
        });
    }

    public override async Task HandleAsync(ForgotPasswordRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new ForgotPasswordCommand(req.Email), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
