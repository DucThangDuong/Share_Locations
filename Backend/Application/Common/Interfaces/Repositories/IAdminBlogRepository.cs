using Application.Common;
using Application.DTOs.Admin;

namespace Application.Common.Interfaces.Repositories;

public interface IAdminBlogRepository
{
    Task<PagedResult<AdminBlogListItemDto>> GetAdminBlogsAsync(
        int? categoryId,
        string? status,
        string? keyword,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<AdminBlogDetailDto?> GetAdminBlogDetailAsync(long id, CancellationToken ct = default);
    Task<long> CreateAdminBlogAsync(CreateAdminBlogInput input, long authorId, CancellationToken ct = default);
    Task<bool> UpdateAdminBlogAsync(long id, UpdateAdminBlogInput input, CancellationToken ct = default);
    Task<bool> UpdateAdminBlogStatusAsync(long id, string status, CancellationToken ct = default);
    Task<bool> DeleteAdminBlogAsync(long id, CancellationToken ct = default);
}
