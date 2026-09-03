using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Backend.UnitTests;

public class DomainTests
{
    [Fact]
    public void CreatePlace_WithValidData_ShouldInitializeWithPendingStatus()
    {
        // Act
        var place = new Place(
            provinceId: 1,
            categoryId: 2,
            name: "Bà Nà Hills",
            address: "Hòa Vang, Đà Nẵng",
            minPrice: 500000,
            maxPrice: 1000000);

        // Assert
        place.Name.Should().Be("Bà Nà Hills");
        place.Address.Should().Be("Hòa Vang, Đà Nẵng");
        place.Status.Should().Be(PlaceStatus.Pending);
        place.MinPrice.Should().Be(500000);
        place.MaxPrice.Should().Be(1000000);
        place.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void CreatePlace_WhenMinPriceGreaterThanMaxPrice_ShouldThrowArgumentException()
    {
        // Act
        Action act = () => new Place(
            provinceId: 1,
            categoryId: 2,
            name: "Hồ Gươm",
            address: "Hoàn Kiếm, Hà Nội",
            minPrice: 200000,
            maxPrice: 100000);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Giá tối thiểu không được lớn hơn giá tối đa*");
    }

    [Fact]
    public void Place_ApproveAndHide_ShouldChangeStatusProperly()
    {
        // Arrange
        var place = new Place(1, 1, "Chùa Cầu", "Hội An, Quảng Nam");

        // Act
        place.Approve();

        // Assert
        place.Status.Should().Be(PlaceStatus.Approved);

        // Act 2
        place.Hide();

        // Assert 2
        place.Status.Should().Be(PlaceStatus.Hidden);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void CreateReview_WithInvalidRating_ShouldThrowArgumentOutOfRangeException(byte invalidRating)
    {
        // Act
        Action act = () => new Review(placeId: 1, userId: 1, rating: invalidRating, content: "Review content");

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithMessage("*Điểm đánh giá phải từ 1 đến 5*");
    }

    [Fact]
    public void CreateTrip_WhenStartDateAfterEndDate_ShouldThrowArgumentException()
    {
        // Act
        Action act = () => new Trip(
            userId: 1,
            title: "Chuyến đi Đà Lạt",
            startDate: new DateOnly(2026, 6, 10),
            endDate: new DateOnly(2026, 6, 5));

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Ngày bắt đầu không được sau ngày kết thúc*");
    }
}
