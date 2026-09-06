using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Foods.Queries;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class FoodsFeaturesTests
{
    private readonly IFoodRepository _foodRepo = Substitute.For<IFoodRepository>();

    [Fact]
    public async Task GetFoods_ShouldReturnList_WhenFoodsExist()
    {
        // Arrange
        var sampleFoods = new List<FoodItemDto>
        {
            new()
            {
                Id = 1,
                Name = "Phở Bò Hà Nội",
                Region = "north",
                RegionName = "Miền Bắc",
                PriceRange = "40.000đ - 70.000đ",
                Highlights = new List<string> { "Nước dùng thanh ngọt" },
                SuggestedPlaces = new List<FoodSuggestedPlaceDto>
                {
                    new() { Name = "Phở Thìn", Address = "Hà Nội", Rating = 4.7m, Price = "65.000đ" }
                }
            }
        };

        _foodRepo.GetFoodsAsync("north", null, null, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(sampleFoods);

        var handler = new GetFoodsQueryHandler(_foodRepo);

        // Act
        var result = await handler.Handle(
            new GetFoodsQuery(Region: "north", Page: 1, PageSize: 10),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data![0].Name.Should().Be("Phở Bò Hà Nội");
        result.Data[0].Region.Should().Be("north");
        result.Data[0].SuggestedPlaces.Should().HaveCount(1);
    }
}
