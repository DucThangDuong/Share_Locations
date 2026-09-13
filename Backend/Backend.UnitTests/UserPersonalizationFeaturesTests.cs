using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Proposals.Commands;
using Application.Features.Users.Commands;
using Application.Features.Users.Queries;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class UserPersonalizationFeaturesTests
{
    private readonly IUserPersonalizationRepository _personalizationRepo = Substitute.For<IUserPersonalizationRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task GetUserFavorites_ShouldReturnSuccessWithData()
    {
        // Arrange
        var mockResult = new UserFavoritePagedResultDto
        {
            Items = new List<UserFavoriteItemDto>
            {
                new()
                {
                    Id = 1,
                    TargetId = 10,
                    TargetType = 1,
                    Title = "Phở Bát Đàn",
                    Subtitle = "Hà Nội",
                    Rating = 4.8,
                    ReviewCount = 120,
                    SavedDate = DateTime.UtcNow.ToString("O")
                }
            },
            Page = 1,
            PageSize = 12,
            TotalCount = 1
        };

        _personalizationRepo.GetFavoritesAsync(1, null, null, null, 1, 12, Arg.Any<CancellationToken>())
            .Returns(mockResult);

        var handler = new GetUserFavoritesQueryHandler(_personalizationRepo);
        var query = new GetUserFavoritesQuery(1, null, null, null, 1, 12);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Items.Should().HaveCount(1);
        result.Data.Items[0].Title.Should().Be("Phở Bát Đàn");
    }

    [Fact]
    public async Task CreateVisitLog_ShouldRejectFutureDate()
    {
        // Arrange
        var mockPlace = Substitute.For<Place>();
        _unitOfWork.Places.GetByIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(mockPlace);

        var handler = new CreateVisitLogCommandHandler(_unitOfWork);
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)).ToString("yyyy-MM-dd");
        var command = new CreateVisitLogCommand(1, 1, futureDate, 0);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("không được lớn hơn ngày hiện tại");
    }

    [Fact]
    public async Task CreateProposal_ShouldRequireNameAndAddress()
    {
        // Arrange
        var handler = new CreateProposalCommandHandler(_unitOfWork);
        var command = new CreateProposalCommand(1, new CreateProposalRequestDto
        {
            Name = "",
            Address = ""
        });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("không được để trống");
    }

    [Fact]
    public async Task DeleteProposal_ShouldForbidWhenNotOwner()
    {
        // Arrange
        var proposal = new Proposal(999, "{}"); // Owner is 999
        _unitOfWork.Proposals.GetByIdAsync(10, Arg.Any<CancellationToken>())
            .Returns(proposal);

        var handler = new DeleteProposalCommandHandler(_unitOfWork);
        var command = new DeleteProposalCommand(10, 1); // User 1 trying to delete

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("không có quyền");
    }

    [Fact]
    public async Task AddFavorite_ShouldReturnSuccess_WhenValid()
    {
        // Arrange
        _unitOfWork.Favorites.GetAsync(1, 10, FavoriteTargetType.Place, Arg.Any<CancellationToken>())
            .Returns((Favorite?)null);

        var handler = new AddFavoriteCommandHandler(_unitOfWork);
        var command = new AddFavoriteCommand(1, 1, 10);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.IsSaved.Should().BeTrue();
        result.Data.TargetType.Should().Be(1);
        result.Data.TargetId.Should().Be(10);
        await _unitOfWork.Favorites.Received(1).AddAsync(Arg.Any<Favorite>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
