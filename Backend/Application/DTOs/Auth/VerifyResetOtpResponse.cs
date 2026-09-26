namespace Application.DTOs.Auth;

public class VerifyResetOtpResponse
{
    public string ResetToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
