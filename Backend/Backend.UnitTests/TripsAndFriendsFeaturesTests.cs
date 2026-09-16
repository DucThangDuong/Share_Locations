using Application.DTOs;
using Application.Features.Blogs.Commands;
using Application.Features.Friends.Commands;
using Application.Features.Trips.Commands;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class TripsAndFriendsFeaturesTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task CreateTrip_ShouldFail_WhenTitleIsEmpty()
    {
        // Arrange
        var handler = new CreateTripCommandHandler(_unitOfWork);
        var command = new CreateTripCommand(1, new CreateTripRequestDto { Title = "" });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Tiêu đề");
    }

    [Fact]
    public async Task DeleteTrip_ShouldForbid_WhenUserIsNotOwner()
    {
        // Arrange
        var trip = new Trip(10, "Chuyến đi Đà Lạt"); // OwnerId = 10
        _unitOfWork.Trips.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(trip);

        var handler = new DeleteTripCommandHandler(_unitOfWork);
        var command = new DeleteTripCommand(1, UserId: 99); // Hacker User 99

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task InviteTripMember_ShouldForbid_WhenUserIsNotOwner()
    {
        // Arrange
        var trip = new Trip(10, "Chuyến đi Đà Lạt"); // OwnerId = 10
        _unitOfWork.Trips.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(trip);

        var handler = new InviteTripMemberCommandHandler(_unitOfWork);
        var command = new InviteTripMemberCommand(1, OwnerUserId: 99, new InviteTripMemberRequestDto { Email = "friend@example.com" });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task RemoveTripMember_ShouldAllow_WhenMemberLeavesSelf()
    {
        // Arrange
        var trip = new Trip(10, "Chuyến đi Đà Lạt"); // OwnerId = 10
        var member = new TripMember(1, 20, TripMemberRole.Member);
        _unitOfWork.Trips.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(trip);
        _unitOfWork.Trips.GetMemberAsync(1, 20, Arg.Any<CancellationToken>()).Returns(member);

        var handler = new RemoveTripMemberCommandHandler(_unitOfWork);
        // User 20 tự rút lui
        var command = new RemoveTripMemberCommand(TripId: 1, TargetUserId: 20, CurrentUserId: 20);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Message.Should().Contain("rời khỏi");
        _unitOfWork.Trips.Received(1).RemoveMember(member);
    }

    [Fact]
    public async Task RemoveTripMember_ShouldForbid_WhenNonOwnerKicksAnother()
    {
        // Arrange
        var trip = new Trip(10, "Chuyến đi Đà Lạt"); // OwnerId = 10
        _unitOfWork.Trips.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(trip);

        var handler = new RemoveTripMemberCommandHandler(_unitOfWork);
        // User 20 cố gắng kick User 30
        var command = new RemoveTripMemberCommand(TripId: 1, TargetUserId: 30, CurrentUserId: 20);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ToggleBlogLike_ShouldLike_WhenNotAlreadyLiked()
    {
        // Arrange
        var blog = new Blog(1, "Bài viết hay", "Mô tả", "{}", null);
        _unitOfWork.Blogs.GetByIdAsync(5, Arg.Any<CancellationToken>()).Returns(blog);
        _unitOfWork.Favorites.GetAsync(10, 5, FavoriteTargetType.Blog, Arg.Any<CancellationToken>())
            .Returns((Favorite?)null);
        _unitOfWork.Favorites.CountAsync(5, FavoriteTargetType.Blog, Arg.Any<CancellationToken>())
            .Returns(1);

        var handler = new ToggleBlogLikeCommandHandler(_unitOfWork);
        var command = new ToggleBlogLikeCommand(BlogId: 5, UserId: 10);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data!.IsLiked.Should().BeTrue();
        result.Data.LikesCount.Should().Be(1);
        await _unitOfWork.Favorites.Received(1).AddAsync(Arg.Any<Favorite>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SendFriendRequest_ShouldFail_WhenTargetIsSelf()
    {
        // Arrange
        var handler = new SendFriendRequestCommandHandler(_unitOfWork);
        var command = new SendFriendRequestCommand(UserId: 10, TargetUserId: 10);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("chính mình");
    }

    [Fact]
    public async Task RespondFriendRequest_ShouldForbid_WhenSenderTriesToAcceptOwnRequest()
    {
        // Arrange
        var friendship = new Friendship(10, 20, actionUserId: 10); // User 10 là người gửi lời mời
        _unitOfWork.Friendships.GetFriendshipAsync(10, 20, Arg.Any<CancellationToken>()).Returns(friendship);

        var handler = new RespondFriendRequestCommandHandler(_unitOfWork);
        // User 10 cố tình gọi Accept lời mời do chính mình tạo
        var command = new RespondFriendRequestCommand(UserId: 10, TargetUserId: 20, Action: "accept");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }
}
