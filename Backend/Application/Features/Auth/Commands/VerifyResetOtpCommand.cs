using System.Security.Cryptography;
using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs.Auth;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Auth.Commands;

public record VerifyResetOtpCommand(string Email, string OtpCode) : IRequest<Result<VerifyResetOtpResponse>>;

public class VerifyResetOtpCommandHandler : IRequestHandler<VerifyResetOtpCommand, Result<VerifyResetOtpResponse>>
{
    private readonly ICacheService _cacheService;
    private readonly ILogger<VerifyResetOtpCommandHandler> _logger;

    public VerifyResetOtpCommandHandler(ICacheService cacheService, ILogger<VerifyResetOtpCommandHandler> logger)
    {
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<Result<VerifyResetOtpResponse>> Handle(VerifyResetOtpCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var otpKey = $"forgot_password:otp:{normalizedEmail}";
        var cachedOtp = await _cacheService.GetAsync<string>(otpKey, ct);

        if (string.IsNullOrEmpty(cachedOtp))
        {
            return Result<VerifyResetOtpResponse>.Failure("Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu lại mã mới.");
        }

        if (cachedOtp != request.OtpCode.Trim())
        {
            return Result<VerifyResetOtpResponse>.Failure("Mã xác thực không chính xác. Vui lòng kiểm tra lại.");
        }

        await _cacheService.RemoveAsync(otpKey, ct);

        var randomBytes = new byte[32];
        RandomNumberGenerator.Fill(randomBytes);
        var resetToken = Convert.ToHexString(randomBytes).ToLowerInvariant();

        var resetTokenKey = $"forgot_password:reset_token:{resetToken}";
        var expiration = TimeSpan.FromMinutes(10);
        await _cacheService.SetAsync(resetTokenKey, normalizedEmail, expiration, ct);

        _logger.LogInformation("🛡️ Xác thực OTP thành công cho {Email}. Đã cấp ResetToken tạm thời có hạn 10 phút.", normalizedEmail);

        var response = new VerifyResetOtpResponse
        {
            ResetToken = resetToken,
            ExpiresAt = DateTime.UtcNow.Add(expiration)
        };

        return Result<VerifyResetOtpResponse>.Success(response, "Xác thực mã OTP thành công. Vui lòng tiến hành đặt mật khẩu mới.");
    }
}
