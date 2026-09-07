using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Places.Commands;
using Application.Features.Places.Queries;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
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
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var handler = new CreatePlaceReviewCommandHandler(unitOfWork);

        // Act
        var result = await handler.Handle(
            new CreatePlaceReviewCommand(1, 10, invalidRating, "Nội dung", null, null),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("từ 1 đến 5");
        await unitOfWork.DidNotReceiveWithAnyArgs().SaveChangesAsync(default);
    }

    [Fact]
    public async Task CreatePlaceReview_ShouldReturnCreatedReview_WhenValid()
    {
        // Arrange
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var samplePlace = new Place(1, 1, "Bà Nà Hills", "Đà Nẵng");
        var sampleUser = new User("test@example.com", "hash", UserRole.User);
        sampleUser.SetProfile(new UserProfile(0, "Nguyễn Văn A"));

        unitOfWork.Places.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(samplePlace);
        unitOfWork.Users.GetByIdWithProfileAsync(10, Arg.Any<CancellationToken>()).Returns(sampleUser);
        unitOfWork.Reviews.GetPlaceStatsAsync(1, Arg.Any<CancellationToken>()).Returns((5.0m, 1));
        unitOfWork.ExecuteInTransactionAsync(Arg.Any<Func<Task>>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<Func<Task>>()());

        var handler = new CreatePlaceReviewCommandHandler(unitOfWork);

        // Act
        var result = await handler.Handle(
            new CreatePlaceReviewCommand(1, 10, 5, "Rất đáng trải nghiệm!", null, null),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Rating.Should().Be(5);
        result.Data.UserName.Should().Be("Nguyễn Văn A");
        result.Data.Content.Should().Be("Rất đáng trải nghiệm!");
    }

    [Fact]
    public async Task CreatePlaceReport_ShouldReturnSuccess_WhenRepositorySucceeds()
    {
        // Arrange
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var samplePlace = new Place(1, 1, "Bà Nà Hills", "Đà Nẵng");
        var sampleReportType = new ReportType("WRONG_INFO", "Địa chỉ sai", true, 1);

        unitOfWork.Places.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(samplePlace);
        unitOfWork.ReportTypes.GetDefaultAsync(Arg.Any<CancellationToken>()).Returns(sampleReportType);

        var handler = new CreatePlaceReportCommandHandler(unitOfWork);

        // Act
        var result = await handler.Handle(
            new CreatePlaceReportCommand(1, "WRONG_INFO", "Địa chỉ sai", "reporter@test.com", 10),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
        await unitOfWork.PlaceReports.Received(1).AddAsync(Arg.Any<PlaceReport>(), Arg.Any<CancellationToken>());
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ToggleSavePlace_ShouldReturnSaved_WhenSaveIsTrue()
    {
        // Arrange
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var samplePlace = new Place(1, 1, "Bà Nà Hills", "Đà Nẵng");

        unitOfWork.Places.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(samplePlace);
        unitOfWork.Favorites.GetAsync(10, 1, FavoriteTargetType.Place, Arg.Any<CancellationToken>())
            .Returns((Favorite?)null);

        var handler = new ToggleSavePlaceCommandHandler(unitOfWork);

        // Act
        var result = await handler.Handle(new ToggleSavePlaceCommand(1, 10, Save: true), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsSaved.Should().BeTrue();
        result.Data.PlaceId.Should().Be(1);
        await unitOfWork.Favorites.Received(1).AddAsync(Arg.Any<Favorite>(), Arg.Any<CancellationToken>());
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ToggleSavePlace_ShouldReturnUnsaved_WhenSaveIsFalse()
    {
        // Arrange
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var samplePlace = new Place(1, 1, "Bà Nà Hills", "Đà Nẵng");
        var sampleFavorite = new Favorite(10, 1, FavoriteTargetType.Place);

        unitOfWork.Places.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(samplePlace);
        unitOfWork.Favorites.GetAsync(10, 1, FavoriteTargetType.Place, Arg.Any<CancellationToken>())
            .Returns(sampleFavorite);

        var handler = new ToggleSavePlaceCommandHandler(unitOfWork);

        // Act
        var result = await handler.Handle(new ToggleSavePlaceCommand(1, 10, Save: false), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsSaved.Should().BeFalse();
        result.Data.PlaceId.Should().Be(1);
        unitOfWork.Favorites.Received(1).Remove(sampleFavorite);
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
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
