namespace Application.Common.Interfaces;

public interface IModerationKeywordStore
{
    Task<IReadOnlyList<string>> GetKeywordsAsync(string category, CancellationToken ct = default);
    Task<bool> AddKeywordAsync(string category, string keyword, CancellationToken ct = default);
    Task<bool> RemoveKeywordAsync(string category, string keyword, CancellationToken ct = default);
    Task<object> GetCompiledAutomatonAsync(CancellationToken ct = default);
    Task InvalidateCacheAsync(CancellationToken ct = default);
}
