using Domain.Enums;

namespace Application.DTOs;

public class UserDto
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; }
    public string RankLevel { get; set; } = "Tân binh";
    public int ReputationScore { get; set; }
}
