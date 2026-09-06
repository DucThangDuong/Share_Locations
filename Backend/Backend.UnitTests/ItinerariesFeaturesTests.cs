using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Itineraries.Commands;
using Application.Features.Itineraries.Queries;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class ItinerariesFeaturesTests
{
    private readonly ITripRepository _tripRepo = Substitute.For<ITripRepository>();

    [Fact]
    public async Task GetItineraries_ShouldReturnList_WhenItinerariesExist()
    {
        // Arrange
        var itineraries = new List<ItineraryDto>
        {
            new()
            {
                Id = 1,
                Title = "Hành Trình Khám Phá Đà Nẵng 3N2Đ",
                Duration = "3 Ngày 2 Đêm",
                DaysCount = 3,
                Region = "central",
                Days = new List<ItineraryDayDto>
                {
                    new()
                    {
                        DayNumber = 1,
                        Title = "Ngày 1: Biển Mỹ Khê & Bán đảo Sơn Trà",
                        Stops = new List<ItineraryStopDto>
                        {
                            new() { Time = "08:30", Activity = "Ăn sáng Mì Quảng", Location = "Đà Nẵng" }
                        }
                    }
                }
            }
        };

        _tripRepo.GetItinerariesAsync("3", "central", null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(itineraries);

        var handler = new GetItinerariesQueryHandler(_tripRepo);

        // Act
        var result = await handler.Handle(
            new GetItinerariesQuery(Duration: "3", Region: "central", Page: 1, PageSize: 10),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data![0].Title.Should().Contain("Đà Nẵng");
        result.Data[0].Days.Should().HaveCount(1);
        result.Data[0].Days[0].Stops.Should().HaveCount(1);
    }

    [Fact]
    public async Task SaveItinerary_ShouldReturnSavedTrue_WhenSuccessful()
    {
        // Arrange
        _tripRepo.SaveItineraryAsync(10, 1, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new SaveItineraryCommandHandler(_tripRepo);

        // Act
        var result = await handler.Handle(new SaveItineraryCommand(1, 10), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Saved.Should().BeTrue();
        result.Data.ItineraryId.Should().Be(1);
    }
}
