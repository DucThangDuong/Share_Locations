using Application.DTOs;

namespace Application.Common.Interfaces.Repositories;

public interface IBlogRepository
{
    Task<IReadOnlyList<BlogListItemDto>> GetBlogsAsync(
        BlogFilterParams filterParams,
        CancellationToken ct = default);

    Task<IReadOnlyList<BlogListItemDto>> GetBlogsAsync(
        string? category,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<BlogListItemDto?> GetFeaturedBlogAsync(CancellationToken ct = default);

    Task<BlogDetailDto?> GetBlogDetailAsync(string idOrSlug, CancellationToken ct = default);

    Task<BlogForEditDto?> GetBlogForEditAsync(long blogId, long userId, CancellationToken ct = default);
}
