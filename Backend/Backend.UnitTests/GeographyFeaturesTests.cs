using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Geography.Queries;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class GeographyFeaturesTests
{
    private readonly IRegionRepository _regionRepo = Substitute.For<IRegionRepository>();
    private readonly ICacheService _cacheService = Substitute.For<ICacheService>();

    [Theory]
    [InlineData("mien-bac", "north")]
    [InlineData("north", "north")]
    [InlineData("bac", "north")]
    [InlineData("bac-bo", "north")]
    [InlineData("Miền Bắc", "north")]
    [InlineData("mien-trung", "central")]
    [InlineData("central", "central")]
    [InlineData("trung", "central")]
    [InlineData("Miền Trung", "central")]
    [InlineData("mien-nam", "south")]
    [InlineData("south", "south")]
    [InlineData("nam", "south")]
    [InlineData("Miền Nam", "south")]
    public void NormalizeRegionCode_ShouldCorrectlyMapVariousInputs(string input, string expected)
    {
        var result = GetRegionLandingQueryHandler.NormalizeRegionCode(input);
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData("invalid-region")]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("tokyo")]
    public void NormalizeRegionCode_ShouldReturnNull_ForInvalidInput(string input)
    {
        var result = GetRegionLandingQueryHandler.NormalizeRegionCode(input);
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetRegionLanding_ShouldReturnSuccess_WhenSlugIsValid()
    {
        // Arrange
        var mockData = new RegionLandingDto
        {
            Code = "north",
            Name = "Miền Bắc",
            ShortTitle = "Non Nước Di Sản",
            BadgeText = "Khu vực: Miền Bắc",
            HeroHeadline = "Khám phá miền đất non nước",
            Provinces = new List<string> { "Hà Nội", "Hà Giang", "Lào Cai" },
            Landmarks = new List<RegionLandmarkDto>
            {
                new() { Id = 101, Name = "Đỉnh Fansipan", Province = "Lào Cai", Coordinates = new double[] { 22.3, 103.7 } }
            },
            Foods = new List<RegionFoodDto>
            {
                new() { Id = 1, Name = "Phở bò truyền thống", Province = "Hà Nội", Type = "dine-in" }
            },
            Spotlight = new RegionSpotlightDto
            {
                Id = "spotlight-hanoi",
                Title = "Hà Nội 36 Phố Phường"
            }
        };

        _cacheService.GetAsync<RegionLandingDto>(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns((RegionLandingDto?)null);

        _regionRepo.GetRegionLandingAsync("north", Arg.Any<CancellationToken>())
            .Returns(mockData);

        var handler = new GetRegionLandingQueryHandler(_regionRepo, _cacheService);

        // Act
        var result = await handler.Handle(new GetRegionLandingQuery("mien-bac"), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Code.Should().Be("north");
        result.Data.Name.Should().Be("Miền Bắc");
        result.Data.Provinces.Should().Contain("Hà Nội");
        result.Data.Landmarks.Should().HaveCount(1);
        result.Data.Landmarks[0].Coordinates.Should().NotBeNull();
        result.Data.Spotlight.Should().NotBeNull();
        result.Data.Spotlight!.Title.Should().Be("Hà Nội 36 Phố Phường");
    }

    [Fact]
    public async Task GetRegionLanding_ShouldReturnCachedData_WhenCacheHit()
    {
        // Arrange
        var cachedData = new RegionLandingDto
        {
            Code = "north",
            Name = "Miền Bắc"
        };

        _cacheService.GetAsync<RegionLandingDto>(Arg.Is<string>(k => k.Contains("north")), Arg.Any<CancellationToken>())
            .Returns(cachedData);

        var handler = new GetRegionLandingQueryHandler(_regionRepo, _cacheService);

        // Act
        var result = await handler.Handle(new GetRegionLandingQuery("north"), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeSameAs(cachedData);
        await _regionRepo.DidNotReceive().GetRegionLandingAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetRegionLanding_ShouldReturnNotFound_WhenSlugIsInvalid()
    {
        // Arrange
        var handler = new GetRegionLandingQueryHandler(_regionRepo, _cacheService);

        // Act
        var result = await handler.Handle(new GetRegionLandingQuery("non-existent-region"), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }
}
