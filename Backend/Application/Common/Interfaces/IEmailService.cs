namespace Application.Common.Interfaces;

public interface IEmailService
{
    Task SendForgotPasswordOtpAsync(string toEmail, string otpCode, int expirationMinutes, CancellationToken ct = default);
}
