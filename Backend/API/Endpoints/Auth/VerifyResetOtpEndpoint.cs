using API.DTOs;
using API.DTOs.Auth;
using API.Extensions;
using Application.DTOs.Auth;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Auth;

public class VerifyResetOtpEndpoint : Endpoint<VerifyResetOtpRequest, ApiSuccessResponse<VerifyResetOtpResponse>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/auth/verify-reset-otp");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("auth_strict"));
        Summary(s =>
        {
            s.Summary = "Bước 2: Xác thực mã OTP và nhận ResetToken";
            s.Description = "Đối chiếu mã OTP 6 số từ Redis, nếu đúng sẽ cấp một ResetToken có hạn 10 phút để chuyển sang bước đặt mật khẩu mới.";
        });
    }

    public override async Task HandleAsync(VerifyResetOtpRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new VerifyResetOtpCommand(req.Email, req.OtpCode), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
