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
                PriceRange = "40.000đ - 70.000đ",
                MinPrice = 40000m,
                MaxPrice = 70000m,
                Description = "Món ngon truyền thống Hà Nội",
                ImageUrl = "https://example.com/pho.jpg",
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
        result.Data[0].PriceRange.Should().Be("40.000đ - 70.000đ");
        result.Data[0].SuggestedPlaces.Should().HaveCount(1);
    }
}
