using Application.Common.Events;
using Application.Common.Interfaces;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Consumers;

public class SendForgotPasswordEmailConsumer : IConsumer<SendForgotPasswordEmailEvent>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<SendForgotPasswordEmailConsumer> _logger;

    public SendForgotPasswordEmailConsumer(IEmailService emailService, ILogger<SendForgotPasswordEmailConsumer> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SendForgotPasswordEmailEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("📨 [RabbitMQ Consumer] Nhận message gửi email OTP quên mật khẩu tới {Email} (Created: {CreatedAt})", 
            message.Email, message.CreatedAt);

        await _emailService.SendForgotPasswordOtpAsync(
            message.Email, 
            message.OtpCode, 
            message.ExpirationMinutes, 
            context.CancellationToken);

        _logger.LogInformation("✅ [RabbitMQ Consumer] Hoàn thành xử lý gửi email cho {Email}", message.Email);
    }
}
