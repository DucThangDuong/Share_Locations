using API.DTOs.Blogs;
using API.DTOs.Foods;
using API.DTOs.Itineraries;
using API.DTOs.Places;
using FluentAssertions;
using Xunit;

namespace Backend.UnitTests;

public class RequestValidationSecurityTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(255)]
    public void CreatePlaceReviewValidator_ShouldFail_WhenRatingIsOutOfRange(byte rating)
    {
        // Arrange
        var validator = new CreatePlaceReviewRequestValidator();
        var req = new CreatePlaceReviewRequest { Id = 1, Rating = rating, Content = "Tốt" };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Rating");
    }

    [Fact]
    public void CreatePlaceReviewValidator_ShouldFail_WhenPlaceIdIsZeroOrNegative()
    {
        // Arrange
        var validator = new CreatePlaceReviewRequestValidator();
        var req = new CreatePlaceReviewRequest { Id = 0, Rating = 5, Content = "Tốt" };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Id");
    }

    [Fact]
    public void CreatePlaceReviewValidator_ShouldFail_WhenContentExceeds2000Characters()
    {
        // Arrange
        var validator = new CreatePlaceReviewRequestValidator();
        var longContent = new string('a', 2001);
        var req = new CreatePlaceReviewRequest { Id = 1, Rating = 5, Content = longContent };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Content");
    }

    [Fact]
    public void CreatePlaceReviewValidator_ShouldPass_WhenValid()
    {
        // Arrange
        var validator = new CreatePlaceReviewRequestValidator();
        var req = new CreatePlaceReviewRequest { Id = 1, Rating = 4, Content = "Đồ ăn ngon, phục vụ nhanh nhẹn" };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreatePlaceReportValidator_ShouldFail_WhenReasonIsEmpty()
    {
        // Arrange
        var validator = new CreatePlaceReportRequestValidator();
        var req = new CreatePlaceReportRequest { Id = 1, Reason = "" };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reason");
    }

    [Fact]
    public void CreatePlaceReportValidator_ShouldFail_WhenEmailIsMalformed()
    {
        // Arrange
        var validator = new CreatePlaceReportRequestValidator();
        var req = new CreatePlaceReportRequest { Id = 1, Reason = "CLOSED", ContactEmail = "not-an-email" };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ContactEmail");
    }

    [Fact]
    public void CreatePlaceReportValidator_ShouldPass_WhenValid()
    {
        // Arrange
        var validator = new CreatePlaceReportRequestValidator();
        var req = new CreatePlaceReportRequest { Id = 1, Reason = "CLOSED", ContactEmail = "user@example.com" };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void GetPlaceReviewsValidator_ShouldFail_WhenPageIsInvalid(int page)
    {
        // Arrange
        var validator = new GetPlaceReviewsRequestValidator();
        var req = new GetPlaceReviewsRequest { Id = 1, Page = page, PageSize = 10 };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Page");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(51)]
    [InlineData(1000)]
    public void GetPlaceReviewsValidator_ShouldFail_WhenPageSizeIsOutOfRange(int pageSize)
    {
        // Arrange
        var validator = new GetPlaceReviewsRequestValidator();
        var req = new GetPlaceReviewsRequest { Id = 1, Page = 1, PageSize = pageSize };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "PageSize");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void GetPlaceReviewsValidator_ShouldFail_WhenRatingFilterIsOutOfRange(int rating)
    {
        // Arrange
        var validator = new GetPlaceReviewsRequestValidator();
        var req = new GetPlaceReviewsRequest { Id = 1, Page = 1, PageSize = 10, Rating = rating };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Rating");
    }

    [Fact]
    public void GetFoodsValidator_ShouldFail_WhenPriceIsNegative()
    {
        // Arrange
        var validator = new GetFoodsRequestValidator();
        var req = new GetFoodsRequest { Page = 1, PageSize = 10, MinPrice = -1000m };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "MinPrice");
    }

    [Fact]
    public void GetItinerariesValidator_ShouldFail_WhenPageSizeExceedsLimit()
    {
        // Arrange
        var validator = new GetItinerariesRequestValidator();
        var req = new GetItinerariesRequest { Page = 1, PageSize = 100 };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "PageSize");
    }

    [Fact]
    public void GetBlogsValidator_ShouldFail_WhenPageIsZero()
    {
        // Arrange
        var validator = new GetBlogsRequestValidator();
        var req = new GetBlogsRequest { Page = 0, PageSize = 9 };

        // Act
        var result = validator.Validate(req);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Page");
    }
}
