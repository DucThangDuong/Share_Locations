using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Places.Queries;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class SearchPlacesQueryTests
{
    [Fact]
    public async Task Handle_ShouldCallRepositoryAndReturnPagedResult_DirectlyWithoutCachePollution()
    {
        // Arrange
        var mockRepo = Substitute.For<IPlaceRepository>();
        var filterParams = new PlaceFilterParams { Keyword = "Đà Nẵng", Page = 1, PageSize = 10 };
        var samplePlaces = new List<PlaceSummaryDto>
        {
            new() { Id = 1, Name = "Bà Nà Hills", Address = "Đà Nẵng" },
            new() { Id = 2, Name = "Cầu Rồng", Address = "Đà Nẵng" }
        };

        mockRepo.SearchAndFilterAsync(filterParams, Arg.Any<CancellationToken>())
            .Returns((samplePlaces, 2));

        var handler = new SearchPlacesQueryHandler(mockRepo);

        // Act
        var result = await handler.Handle(new SearchPlacesQuery(filterParams), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Items.Should().HaveCount(2);
        result.Data.TotalCount.Should().Be(2);
        result.Data.PageIndex.Should().Be(1);
        result.Data.PageSize.Should().Be(10);

        await mockRepo.Received(1).SearchAndFilterAsync(filterParams, Arg.Any<CancellationToken>());
    }
}
