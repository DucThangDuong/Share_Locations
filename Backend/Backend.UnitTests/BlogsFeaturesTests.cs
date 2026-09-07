using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Blogs.Queries;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class BlogsFeaturesTests
{
    private readonly IBlogRepository _blogRepo = Substitute.For<IBlogRepository>();

    [Fact]
    public async Task GetBlogs_ShouldReturnBlogList()
    {
        // Arrange
        var blogs = new List<BlogListItemDto>
        {
            new()
            {
                Id = 1,
                Slug = "kinh-nghiem-ha-long",
                Title = "Kinh nghiệm du lịch Hạ Long 2025",
                Category = "Kinh nghiệm thực tế",
                Featured = true
            }
        };

        _blogRepo.GetBlogsAsync("Kinh nghiệm", null, 1, 9, Arg.Any<CancellationToken>())
            .Returns(blogs);

        var handler = new GetBlogsQueryHandler(_blogRepo);

        // Act
        var result = await handler.Handle(
            new GetBlogsQuery(Category: "Kinh nghiệm", Page: 1, PageSize: 9),
            CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data![0].Slug.Should().Be("kinh-nghiem-ha-long");
    }

    [Fact]
    public async Task GetFeaturedBlog_ShouldReturnFeaturedPost_WhenExists()
    {
        // Arrange
        var featured = new BlogListItemDto
        {
            Id = 1,
            Title = "Top điểm đến mùa hè",
            Featured = true
        };

        _blogRepo.GetFeaturedBlogAsync(Arg.Any<CancellationToken>())
            .Returns(featured);

        var handler = new GetFeaturedBlogQueryHandler(_blogRepo);

        // Act
        var result = await handler.Handle(new GetFeaturedBlogQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Featured.Should().BeTrue();
    }

    [Fact]
    public async Task GetFeaturedBlog_ShouldReturnNotFound_WhenNoneExists()
    {
        // Arrange
        _blogRepo.GetFeaturedBlogAsync(Arg.Any<CancellationToken>())
            .Returns((BlogListItemDto?)null);

        var handler = new GetFeaturedBlogQueryHandler(_blogRepo);

        // Act
        var result = await handler.Handle(new GetFeaturedBlogQuery(), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetBlogDetail_ShouldReturnNotFound_WhenEmptyIdentifier()
    {
        // Arrange
        var handler = new GetBlogDetailQueryHandler(_blogRepo);

        // Act
        var result = await handler.Handle(new GetBlogDetailQuery("   "), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("không hợp lệ");
    }

    [Fact]
    public async Task GetBlogDetail_ShouldReturnDetail_WhenExists()
    {
        // Arrange
        var detail = new BlogDetailDto
        {
            Id = 1,
            Slug = "kinh-nghiem-ha-long",
            Title = "Kinh nghiệm du lịch Hạ Long 2025",
            Content = "Nội dung bài viết"
        };

        _blogRepo.GetBlogDetailAsync("kinh-nghiem-ha-long", Arg.Any<CancellationToken>())
            .Returns(detail);

        var handler = new GetBlogDetailQueryHandler(_blogRepo);

        // Act
        var result = await handler.Handle(new GetBlogDetailQuery("kinh-nghiem-ha-long"), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Slug.Should().Be("kinh-nghiem-ha-long");
        result.Data.Title.Should().Be("Kinh nghiệm du lịch Hạ Long 2025");
    }
}
