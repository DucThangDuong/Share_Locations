using System.Security.Cryptography;
using Application.Common;
using Application.Common.Events;
using Application.Common.Interfaces;
using Domain.Interfaces;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Auth.Commands;

public record ForgotPasswordCommand(string Email) : IRequest<Result<bool>>;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cacheService;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    public ForgotPasswordCommandHandler(
        IUnitOfWork unitOfWork,
        ICacheService cacheService,
        IPublishEndpoint publishEndpoint,
        ILogger<ForgotPasswordCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _cacheService = cacheService;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail, ct);
        if (user == null)
        {
            return Result<bool>.Failure("Email này chưa được đăng ký trong hệ thống.");
        }

        if (user.Status == Domain.Enums.UserStatus.Banned)
        {
            return Result<bool>.Forbidden("Tài khoản này hiện đang bị khóa.");
        }

        // Sinh mã OTP 6 chữ số ngẫu nhiên chuẩn Cryptographic (100000 - 999999)
        var otpCode = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");

        // Lưu vào Redis với TTL đúng 6 phút (360 giây)
        var cacheKey = $"forgot_password:otp:{normalizedEmail}";
        await _cacheService.SetAsync(cacheKey, otpCode, TimeSpan.FromMinutes(6), ct);

        _logger.LogInformation("🔑 Đã tạo mã OTP cho {Email}, lưu Redis key {CacheKey}, TTL 6 phút.", normalizedEmail, cacheKey);

        // Publish sự kiện lên RabbitMQ
        await _publishEndpoint.Publish(new SendForgotPasswordEmailEvent
        {
            Email = normalizedEmail,
            OtpCode = otpCode,
            ExpirationMinutes = 6,
            CreatedAt = DateTime.UtcNow
        }, ct);

        return Result<bool>.Success(true, "Mã xác thực 6 chữ số đã được gửi tới email của bạn (hiệu lực trong 6 phút).");
    }
}
