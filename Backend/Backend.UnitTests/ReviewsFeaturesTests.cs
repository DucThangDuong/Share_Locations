using API.DTOs.Reviews;
using Application.Common;
using Application.DTOs;
using Application.Features.Reviews.Commands;
using Application.Features.Reviews.Queries;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class ReviewsFeaturesTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task CreateReviewComment_ShouldFail_WhenContentIsEmpty()
    {
        // Arrange
        var handler = new CreateReviewCommentCommandHandler(_unitOfWork);
        var command = new CreateReviewCommentCommand(1, 10, "   ");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("trống");
    }

    [Fact]
    public async Task CreateReviewComment_ShouldReturnNotFound_WhenReviewDoesNotExist()
    {
        // Arrange
        _unitOfWork.Reviews.ExistsAsync(999, Arg.Any<CancellationToken>())
            .Returns(false);

        var handler = new CreateReviewCommentCommandHandler(_unitOfWork);
        var command = new CreateReviewCommentCommand(999, 10, "Bình luận thử nghiệm");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
        result.Message.Should().Contain("Bài đánh giá không tồn tại");
    }

    [Fact]
    public async Task CreateReviewComment_ShouldReturnNotFound_WhenParentCommentBelongsToDifferentReview()
    {
        // Arrange
        _unitOfWork.Reviews.ExistsAsync(1, Arg.Any<CancellationToken>())
            .Returns(true);

        // Parent comment belongs to review 2, but command is for review 1
        var otherReviewParentComment = new Comment(2, 20, "Bình luận bài review khác");
        _unitOfWork.Comments.GetByIdAsync(50, Arg.Any<CancellationToken>())
            .Returns(otherReviewParentComment);

        var handler = new CreateReviewCommentCommandHandler(_unitOfWork);
        var command = new CreateReviewCommentCommand(1, 10, "Trả lời bình luận", 50);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
        result.Message.Should().Contain("không thuộc bài đánh giá này");
    }

    [Fact]
    public async Task CreateReviewComment_ShouldReturnSuccess_WhenCreatingTopLevelComment()
    {
        // Arrange
        _unitOfWork.Reviews.ExistsAsync(1, Arg.Any<CancellationToken>())
            .Returns(true);

        var user = new User("user@example.com", "hash", UserRole.User);
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(user, 10L);
        user.SetProfile(new UserProfile(10L, "Nguyễn Văn A"));
        _unitOfWork.Users.GetByIdWithProfileAsync(10, Arg.Any<CancellationToken>())
            .Returns(user);

        var handler = new CreateReviewCommentCommandHandler(_unitOfWork);
        var command = new CreateReviewCommentCommand(1, 10, "Bài đánh giá rất chi tiết!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.ReviewId.Should().Be(1);
        result.Data.Content.Should().Be("Bài đánh giá rất chi tiết!");
        result.Data.UserName.Should().Be("Nguyễn Văn A");
        result.Data.ParentId.Should().BeNull();
        await _unitOfWork.Comments.Received(1).AddAsync(Arg.Any<Comment>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateReviewComment_ShouldReturnSuccess_WhenReplyingToAnotherComment()
    {
        // Arrange
        _unitOfWork.Reviews.ExistsAsync(1, Arg.Any<CancellationToken>())
            .Returns(true);

        var parentComment = new Comment(1, 20, "Giá vé ở đây bao nhiêu bạn?");
        _unitOfWork.Comments.GetByIdAsync(100, Arg.Any<CancellationToken>())
            .Returns(parentComment);

        var user = new User("user2@example.com", "hash", UserRole.User);
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(user, 30L);
        user.SetProfile(new UserProfile(30L, "Trần Thị B"));
        _unitOfWork.Users.GetByIdWithProfileAsync(30, Arg.Any<CancellationToken>())
            .Returns(user);

        var handler = new CreateReviewCommentCommandHandler(_unitOfWork);
        var command = new CreateReviewCommentCommand(1, 30, "Khoảng 500k/người nha bạn", 100);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.ReviewId.Should().Be(1);
        result.Data.ParentId.Should().Be(100);
        result.Data.Content.Should().Be("Khoảng 500k/người nha bạn");
        result.Data.UserName.Should().Be("Trần Thị B");
        await _unitOfWork.Comments.Received(1).AddAsync(Arg.Any<Comment>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetReviewComments_ShouldReturnCommentsHierarchically_WithRepliesNestedUnderParent()
    {
        // Arrange
        var rootComment = new Comment(1, 10, "Comment gốc");
        typeof(Comment).GetProperty(nameof(Comment.Id))!.SetValue(rootComment, 1L);

        var replyComment = new Comment(1, 20, "Reply cho comment gốc", 1L);
        typeof(Comment).GetProperty(nameof(Comment.Id))!.SetValue(replyComment, 2L);

        var comments = new List<Comment> { rootComment, replyComment };
        _unitOfWork.Comments.GetByReviewIdAsync(1, Arg.Any<CancellationToken>())
            .Returns(comments);

        var handler = new GetReviewCommentsQueryHandler(_unitOfWork);

        // Act
        var result = await handler.Handle(new GetReviewCommentsQuery(1), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.TotalComments.Should().Be(2);
        result.Data.Items.Count.Should().Be(1); // 1 root comment
        result.Data.Items[0].Id.Should().Be(1);
        result.Data.Items[0].Replies.Should().HaveCount(1); // 1 reply nested inside
        result.Data.Items[0].Replies[0].Id.Should().Be(2);
        result.Data.Items[0].Replies[0].ParentId.Should().Be(1);
    }

    [Fact]
    public void CreateReviewCommentRequestValidator_ShouldFail_WhenContentIsEmpty()
    {
        var validator = new CreateReviewCommentRequestValidator();
        var request = new CreateReviewCommentRequest
        {
            ReviewId = 1,
            Content = ""
        };

        var result = validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateReviewCommentRequest.Content));
    }
}
