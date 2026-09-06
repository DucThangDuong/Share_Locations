using FluentAssertions;
using Infrastructure.Persistence.Repositories;
using Xunit;

namespace Backend.UnitTests;

public class SecurityAuditTests
{
    [Theory]
    [InlineData("Kinh Nghiệm Du Lịch Hạ Long Tự Túc 2025", "kinh-nghiem-du-lich-ha-long-tu-tuc-2025")]
    [InlineData("Đà Nẵng & Hội An: Lịch Trình Ăn Chơi 3N2Đ", "da-nang-hoi-an-lich-trinh-an-choi-3n2d")]
    [InlineData("Top 10 Quán Cà Phê 'Sống Ảo' Triệu View!!!", "top-10-quan-ca-phe-song-ao-trieu-view")]
    [InlineData("   Khoảng   trắng   kép   ", "khoang-trang-kep")]
    [InlineData("<script>alert('xss')</script>", "scriptalertxssscript")]
    public void GenerateSlug_ShouldSanitizeAndNormalizeVietnameseCorrectly(string input, string expected)
    {
        // Act
        var slug = BlogRepository.GenerateSlug(input);

        // Assert
        slug.Should().Be(expected);
        slug.Should().NotContain(" ");
        slug.Should().NotContain("<");
        slug.Should().NotContain(">");
    }
}
