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

    [Fact]
    public void CreateFood_WhenMinPriceGreaterThanMaxPrice_ShouldThrowArgumentException()
    {
        // Act
        Action act = () => new Food(
            name: "Phở Bò",
            minPrice: 60000,
            maxPrice: 40000);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Giá tối thiểu không được lớn hơn giá tối đa*");
    }

    [Fact]
    public void CreateFood_WithValidPrices_ShouldSetPropertiesProperly()
    {
        // Act
        var food = new Food(
            name: "Bún Bò Huế",
            minPrice: 45000,
            maxPrice: 65000);

        // Assert
        food.Name.Should().Be("Bún Bò Huế");
        food.MinPrice.Should().Be(45000);
        food.MaxPrice.Should().Be(65000);
    }

    [Fact]
    public void Review_IncrementAndDecrementLikes_ShouldUpdateCountProperly()
    {
        // Arrange
        var review = new Review(1, 1, 5, "Tuyệt vời");

        // Act & Assert
        review.LikesCount.Should().Be(0);
        review.IncrementLikes();
        review.LikesCount.Should().Be(1);
        review.DecrementLikes();
        review.LikesCount.Should().Be(0);
        review.DecrementLikes(); // Should not go negative
        review.LikesCount.Should().Be(0);
    }

    [Fact]
    public void CreateMessage_WithReply_ShouldSetReplyToMessageId()
    {
        // Act
        var msg = new Message(chatRoomId: 10, senderId: 5, content: "Chào bạn!", replyToMessageId: 100);

        // Assert
        msg.ChatRoomId.Should().Be(10);
        msg.SenderId.Should().Be(5);
        msg.Content.Should().Be("Chào bạn!");
        msg.ReplyToMessageId.Should().Be(100);
    }
}
