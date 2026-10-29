namespace Application.Common.Interfaces;

/// <summary>
/// Interface quản lý danh sách từ khóa kiểm duyệt động từ Redis Cache
/// Cho phép Admin thêm/sửa/xóa từ cấm, spam, link quảng cáo realtime không cần redeploy code.
/// </summary>
public interface IModerationKeywordStore
{
    /// <summary>
    /// Lấy danh sách từ khóa theo danh mục (ví dụ: profanity, spam, commercial)
    /// </summary>
    Task<IReadOnlyList<string>> GetKeywordsAsync(string category, CancellationToken ct = default);

    /// <summary>
    /// Thêm từ khóa mới vào Redis
    /// </summary>
    Task<bool> AddKeywordAsync(string category, string keyword, CancellationToken ct = default);

    /// <summary>
    /// Xóa từ khóa khỏi Redis
    /// </summary>
    Task<bool> RemoveKeywordAsync(string category, string keyword, CancellationToken ct = default);

    /// <summary>
    /// Lấy bộ máy đối sánh chuỗi Aho-Corasick Automaton đã biên dịch từ dữ liệu Redis (được cache in-memory)
    /// </summary>
    Task<object> GetCompiledAutomatonAsync(CancellationToken ct = default);

    /// <summary>
    /// Xóa cache in-memory để tải lại dữ liệu mới nhất từ Redis
    /// </summary>
    Task InvalidateCacheAsync(CancellationToken ct = default);
}
