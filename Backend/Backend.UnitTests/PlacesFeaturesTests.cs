using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Places.Commands;
using Application.Features.Places.Queries;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class PlacesFeaturesTests
{
    private readonly IPlaceRepository _placeRepo = Substitute.For<IPlaceRepository>();

    [Fact]
    public async Task GetPlaceDetail_ShouldReturnSuccess_WhenPlaceExists()
    {
        // Arrange
        var samplePlace = new PlaceDetailDto
        {
            Id = 1,
            Name = "Bà Nà Hills",
            Address = "Hòa Vang, Đà Nẵng",
            AvgRating = 4.8m,
            ReviewCount = 1500
        };
        _placeRepo.GetPlaceDetailAsync(1, Arg.Any<CancellationToken>())
            .Returns(samplePlace);

        var handler = new GetPlaceDetailQueryHandler(_placeRepo);

        // Act
        var result = await handler.Handle(new GetPlaceDetailQuery(1), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be(1);
        result.Data.Name.Should().Be("Bà Nà Hills");
        await _placeRepo.Received(1).GetPlaceDetailAsync(1, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetPlaceDetail_ShouldReturnNotFound_WhenPlaceDoesNotExist()
    {
        // Arrange
        _placeRepo.GetPlaceDetailAsync(999, Arg.Any<CancellationToken>())
            .Returns((PlaceDetailDto?)null);

        var handler = new GetPlaceDetailQueryHandler(_placeRepo);

        // Act
        var result = await handler.Handle(new GetPlaceDetailQuery(999), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
        result.ErrorCode.Should().Be("NOT_FOUND");
    }

    [Fact]
    public async Task GetPlaceReviews_ShouldReturnSummaryWithBreakdown()
    {
        // Arrange
        var summary = new PlaceReviewSummaryDto
        {
            AvgRating = 4.5m,
            TotalReviews = 2,
            Items = new List<ReviewItemDto>
            {
                new() { Id = 1, Rating = 5, Content = "Tuyệt vời!" },
                new() { Id = 2, Rating = 4, Content = "Rất đẹp nhưng đông" }
            }
        };
        _placeRepo.GetPlaceReviewsAsync(1, 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(summary);

        var handler = new GetPlaceReviewsQueryHandler(_placeRepo);

        // Act
        var result = await handler.Handle(new GetPlaceReviewsQuery(1, 1, 10), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AvgRating.Should().Be(4.5m);
        result.Data.Items.Should().HaveCount(2);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(255)]
    public async Task CreatePlaceReview_ShouldFail_WhenRatingIsOutOfRange(byte invalidRating)
    {
        // Arrange
        var handler = new CreatePlaceReviewCommandHandler(_placeRepo);

        // Act
        var result = await handler.Handle(
            new CreatePlaceReviewCommand(1, 10, invalidRating, "Nội dung", null, null),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("từ 1 đến 5");
        await _placeRepo.DidNotReceiveWithAnyArgs().CreateReviewAsync(default, default, default, default!, default, default);
    }

    [Fact]
    public async Task CreatePlaceReview_ShouldReturnCreatedReview_WhenValid()
    {
        // Arrange
        var createdReview = new ReviewItemDto
        {
            Id = 100,
            UserId = "10",
            UserName = "Nguyễn Văn A",
            Rating = 5,
            Content = "Rất đáng trải nghiệm!",
            CreatedAt = DateTime.UtcNow
        };

        _placeRepo.CreateReviewAsync(1, 10, 5, "Rất đáng trải nghiệm!", Arg.Any<List<string>?>(), Arg.Any<CancellationToken>())
            .Returns(createdReview);

        var handler = new CreatePlaceReviewCommandHandler(_placeRepo);

        // Act
        var result = await handler.Handle(
            new CreatePlaceReviewCommand(1, 10, 5, "Rất đáng trải nghiệm!", null, null),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be(100);
        result.Data.Rating.Should().Be(5);
    }

    [Fact]
    public async Task CreatePlaceReport_ShouldReturnSuccess_WhenRepositorySucceeds()
    {
        // Arrange
        _placeRepo.CreatePlaceReportAsync(1, "WRONG_INFO", "Địa chỉ sai", "reporter@test.com", 10, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CreatePlaceReportCommandHandler(_placeRepo);

        // Act
        var result = await handler.Handle(
            new CreatePlaceReportCommand(1, "WRONG_INFO", "Địa chỉ sai", "reporter@test.com", 10),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
    }

    [Fact]
    public async Task ToggleSavePlace_ShouldReturnSaved_WhenSaveIsTrue()
    {
        // Arrange
        _placeRepo.ToggleSavePlaceAsync(10, 1, true, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new ToggleSavePlaceCommandHandler(_placeRepo);

        // Act
        var result = await handler.Handle(new ToggleSavePlaceCommand(1, 10, Save: true), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsSaved.Should().BeTrue();
        result.Data.PlaceId.Should().Be(1);
    }

    [Fact]
    public async Task ToggleSavePlace_ShouldReturnUnsaved_WhenSaveIsFalse()
    {
        // Arrange
        _placeRepo.ToggleSavePlaceAsync(10, 1, false, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new ToggleSavePlaceCommandHandler(_placeRepo);

        // Act
        var result = await handler.Handle(new ToggleSavePlaceCommand(1, 10, Save: false), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsSaved.Should().BeFalse();
        result.Data.PlaceId.Should().Be(1);
    }

    [Fact]
    public async Task GetPlacesMap_ShouldReturnMapItemsWithCoordinates()
    {
        // Arrange
        var mapItems = new List<PlaceMapItemDto>
        {
            new()
            {
                Id = 1,
                Name = "Cầu Rồng",
                Coordinates = new[] { 108.2272, 16.0611 },
                Category = "Điểm tham quan"
            }
        };

        _placeRepo.GetPlacesMapAsync(null, null, null, null, null, null, null, null, Arg.Any<CancellationToken>())
            .Returns(mapItems);

        var handler = new GetPlacesMapQueryHandler(_placeRepo);

        // Act
        var result = await handler.Handle(new GetPlacesMapQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data![0].Coordinates.Should().HaveCount(2);
        result.Data[0].Coordinates[0].Should().Be(108.2272); // Longitude first (GeoJSON standard)
        result.Data[0].Coordinates[1].Should().Be(16.0611);  // Latitude second
    }
}
