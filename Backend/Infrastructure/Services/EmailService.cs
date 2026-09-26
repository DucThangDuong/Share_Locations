using Application.Common.Interfaces;
using Application.Common.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly MailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _logger = logger;
        _settings = configuration.GetSection("MailSettings").Get<MailSettings>()
                    ?? configuration.GetSection("EmailSettings").Get<MailSettings>()
                    ?? new MailSettings();
    }

    public async Task SendForgotPasswordOtpAsync(string toEmail, string otpCode, int expirationMinutes, CancellationToken ct = default)
    {
        var smtpServer = string.IsNullOrWhiteSpace(_settings.Server) ? "smtp.gmail.com" : _settings.Server;
        var smtpPort = _settings.Port == 0 ? 587 : _settings.Port;
        var senderEmail = _settings.UserName;
        var senderPassword = _settings.Password;
        var displayName = string.IsNullOrWhiteSpace(_settings.DisplayName) ? "Hệ thống Chia sẻ Địa điểm" : _settings.DisplayName;

        // Fallback kiểm thử nội bộ: Nếu chưa có cấu hình Password thực tế, log trực tiếp mã OTP để dev test luồng
        if (string.IsNullOrWhiteSpace(senderPassword) || string.IsNullOrWhiteSpace(senderEmail))
        {
            _logger.LogWarning("⚠️ [DEV-MODE EMAIL SIMULATION] Chưa cấu hình Password hoặc UserName trong MailSettings. Gửi mail giả lập: Email: {Email}, OTP: {OtpCode}, Hết hạn sau: {ExpirationMinutes} phút.",
                toEmail, otpCode, expirationMinutes);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(displayName, senderEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = $"[{otpCode}] - Mã xác thực đặt lại mật khẩu của bạn";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;"">
                    <div style=""text-align: center; margin-bottom: 24px;"">
                        <h2 style=""color: #0ea5e9; margin: 0; font-size: 24px;"">Hệ Thống Chia Sẻ Địa Điểm</h2>
                        <p style=""color: #64748b; font-size: 14px; margin-top: 4px;"">Yêu cầu đặt lại mật khẩu tài khoản</p>
                    </div>
                    <div style=""padding: 20px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 20px;"">
                        <p style=""color: #334155; font-size: 15px; margin: 0 0 16px 0;"">Xin chào,</p>
                        <p style=""color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;"">
                            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email: <strong>{toEmail}</strong>.
                            Vui lòng sử dụng mã xác thực gồm 6 chữ số dưới đây để tiếp tục:
                        </p>
                        <div style=""text-align: center; margin: 28px 0;"">
                            <span style=""display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0284c7; background: #e0f2fe; padding: 12px 28px; border-radius: 8px; border: 2px dashed #38bdf8;"">
                                {otpCode}
                            </span>
                        </div>
                        <p style=""color: #ef4444; font-size: 14px; font-weight: 600; text-align: center; margin: 0;"">
                            ⏱️ Mã xác thực này có hiệu lực trong vòng {expirationMinutes} phút.
                        </p>
                    </div>
                    <p style=""color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;"">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể yên tâm bỏ qua email này. Tài khoản của bạn vẫn được an toàn.
                    </p>
                    <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"" />
                    <p style=""color: #94a3b8; font-size: 12px; text-align: center; margin: 0;"">
                        Đây là email tự động, vui lòng không phản hồi thư này.
                    </p>
                </div>"
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, smtpPort, _settings.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None, ct);
            await client.AuthenticateAsync(senderEmail, senderPassword, ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("Đã gửi thành công email OTP đặt lại mật khẩu tới {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gửi email OTP đặt lại mật khẩu tới {Email}", toEmail);
            throw;
        }
    }
}
