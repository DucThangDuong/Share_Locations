namespace Application.Common.Models;

public class MailSettings
{
    public string Server { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = "Hệ thống Chia sẻ Địa điểm";
    public bool EnableSsl { get; set; } = true;

    // Alias properties để tương thích ngược linh hoạt
    public string SmtpServer { get => Server; set => Server = value; }
    public int SmtpPort { get => Port; set => Port = value; }
    public string SenderEmail { get => UserName; set => UserName = value; }
    public string SenderName { get => DisplayName; set => DisplayName = value; }
    public string SenderPassword { get => Password; set => Password = value; }
}

// Alias cho EmailSettings để tương thích với code cũ
public class EmailSettings : MailSettings
{
}
