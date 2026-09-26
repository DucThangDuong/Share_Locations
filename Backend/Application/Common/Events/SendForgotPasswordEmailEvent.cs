namespace Application.Common.Events;

public record SendForgotPasswordEmailEvent
{
    public string Email { get; init; } = string.Empty;
    public string OtpCode { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 6;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
