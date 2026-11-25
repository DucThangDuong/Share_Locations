using System.Text.Json;
using Application.Common.Interfaces;
using Domain.Enums;
using Infrastructure.Caching.Connection;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Infrastructure.Services.ContentModeration;

public class RedisModerationKeywordStore : IModerationKeywordStore
{
    private readonly ILogger<RedisModerationKeywordStore> _logger;
    private readonly IServiceScopeFactory? _scopeFactory;
    private readonly IRedisConnectionProvider? _redisProvider;
    private readonly IConnectionMultiplexer? _redis;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private AhoCorasick? _cachedAutomaton;
    private DateTime _lastCacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

    public const string ProfanitySetKey = "moderation:keywords:profanity";
    public const string SpamSetKey = "moderation:keywords:spam";

    private static readonly char[] KeywordSeparators = [',', ';', '\r', '\n'];

    public RedisModerationKeywordStore(
        ILogger<RedisModerationKeywordStore> logger,
        IServiceScopeFactory? scopeFactory = null,
        IRedisConnectionProvider? redisProvider = null,
        IConnectionMultiplexer? redis = null)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _redisProvider = redisProvider;
        _redis = redis;
    }

    private static string GetRedisKey(string category) =>
        category.Equals("spam", StringComparison.OrdinalIgnoreCase) ? SpamSetKey : ProfanitySetKey;

    private static string GetSettingKey(string category) =>
        category.Equals("spam", StringComparison.OrdinalIgnoreCase)
            ? nameof(SystemSettingKey.SPAM_KEYWORDS)
            : nameof(SystemSettingKey.BLACKLIST_WORDS);

    private IDatabase? TryGetDatabase()
    {
        try
        {
            if (_redisProvider != null)
            {
                return _redisProvider.GetDatabase();
            }
            if (_redis != null && _redis.IsConnected)
            {
                return _redis.GetDatabase();
            }
        }
        catch
        {
        }
        return null;
    }

    public async Task<IReadOnlyList<string>> GetKeywordsAsync(string category, CancellationToken ct = default)
    {
        var key = GetRedisKey(category);
        var db = TryGetDatabase();

        var (dbAvailable, dbKeywords) = await TryLoadKeywordsFromDbAsync(category, ct);
        if (dbKeywords.Count > 0)
        {
            await SyncRedisSetAsync(db, key, dbKeywords);
            return dbKeywords;
        }

        if (!dbAvailable && db != null)
        {
            try
            {
                var members = await db.SetMembersAsync(key);
                if (members.Length > 0)
                {
                    return members
                        .Select(m => (string)m!)
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi đọc từ khóa từ Redis key {Key}", key);
            }
        }

        var seed = LoadSeedKeywordsFromFile(category);
        if (seed.Count > 0)
        {
            await SyncRedisSetAsync(db, key, seed);
        }

        return seed;
    }

    public async Task SyncFromRawSettingAsync(string category, string? rawValue, CancellationToken ct = default)
    {
        var key = GetRedisKey(category);
        var parsed = ParseRawKeywords(rawValue);
        var effective = parsed.Count > 0 ? parsed : LoadSeedKeywordsFromFile(category);

        await SyncRedisSetAsync(TryGetDatabase(), key, effective);
        await InvalidateCacheAsync(ct);

        _logger.LogInformation(
            "Đã đồng bộ {Count} từ khóa kiểm duyệt nhóm '{Category}' vào Redis key '{Key}' (Nguồn: {Source}).",
            effective.Count,
            category,
            key,
            parsed.Count > 0 ? "Database SystemSettings" : "moderation_seed_keywords.json");
    }

    private async Task<(bool DbAvailable, IReadOnlyList<string> Keywords)> TryLoadKeywordsFromDbAsync(string category, CancellationToken ct)
    {
        if (_scopeFactory == null)
        {
            return (false, Array.Empty<string>());
        }

        var settingKey = GetSettingKey(category);
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetService<TravelReviewDbContext>();
            if (dbContext == null)
            {
                return (false, Array.Empty<string>());
            }

            var rawValue = await dbContext.SystemSettings
                .AsNoTracking()
                .Where(s => s.SettingKey == settingKey)
                .Select(s => s.SettingValue)
                .FirstOrDefaultAsync(ct);

            return (true, ParseRawKeywords(rawValue));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể đọc danh sách từ khóa '{SettingKey}' từ SQL Server, chuyển sang Redis/File dự phòng.", settingKey);
            return (false, Array.Empty<string>());
        }
    }

    private async Task SyncRedisSetAsync(IDatabase? db, string key, IReadOnlyList<string> keywords)
    {
        if (db == null) return;

        try
        {
            await db.KeyDeleteAsync(key);
            if (keywords.Count > 0)
            {
                var values = keywords
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => (RedisValue)x.Trim().ToLowerInvariant())
                    .Distinct()
                    .ToArray();

                if (values.Length > 0)
                {
                    await db.SetAddAsync(key, values);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi khi đồng bộ từ khóa vào Redis key {Key}", key);
        }
    }

    private static IReadOnlyList<string> ParseRawKeywords(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return Array.Empty<string>();
        }

        return rawValue
            .Split(KeywordSeparators, StringSplitOptions.RemoveEmptyEntries)
            .Select(k => k.Trim().ToLowerInvariant())
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<bool> AddKeywordAsync(string category, string keyword, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(keyword)) return false;
        var key = category.Equals("spam", StringComparison.OrdinalIgnoreCase) ? SpamSetKey : ProfanitySetKey;
        var normalized = keyword.Trim().ToLowerInvariant();

        var db = TryGetDatabase();
        if (db != null)
        {
            try
            {
                var added = await db.SetAddAsync(key, normalized);
                await InvalidateCacheAsync(ct);
                _logger.LogInformation("Đã thêm từ khóa '{Keyword}' vào Redis set '{Key}' (Realtime, không sửa code)", normalized, key);
                return added;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi thêm từ khóa vào Redis");
                return false;
            }
        }

        return false;
    }

    public async Task<bool> RemoveKeywordAsync(string category, string keyword, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(keyword)) return false;
        var key = category.Equals("spam", StringComparison.OrdinalIgnoreCase) ? SpamSetKey : ProfanitySetKey;
        var normalized = keyword.Trim().ToLowerInvariant();

        var db = TryGetDatabase();
        if (db != null)
        {
            try
            {
                var removed = await db.SetRemoveAsync(key, normalized);
                await InvalidateCacheAsync(ct);
                _logger.LogInformation("Đã xóa từ khóa '{Keyword}' khỏi Redis set '{Key}'", normalized, key);
                return removed;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa từ khóa khỏi Redis");
                return false;
            }
        }

        return false;
    }

    public async Task<object> GetCompiledAutomatonAsync(CancellationToken ct = default)
    {
        return await GetAhoCorasickAsync(ct);
    }

    public async Task<AhoCorasick> GetAhoCorasickAsync(CancellationToken ct = default)
    {
        if (_cachedAutomaton != null && DateTime.UtcNow - _lastCacheTime < CacheTtl)
        {
            return _cachedAutomaton;
        }

        await _lock.WaitAsync(ct);
        try
        {
            if (_cachedAutomaton != null && DateTime.UtcNow - _lastCacheTime < CacheTtl)
            {
                return _cachedAutomaton;
            }

            var patterns = new List<(string Keyword, string Category)>();

            var profanityWords = await GetKeywordsAsync("profanity", ct);
            foreach (var w in profanityWords)
            {
                patterns.Add((w, "Profanity"));
            }

            var spamWords = await GetKeywordsAsync("spam", ct);
            foreach (var w in spamWords)
            {
                patterns.Add((w, "CommercialSpam"));
            }

            _cachedAutomaton = new AhoCorasick(patterns);
            _lastCacheTime = DateTime.UtcNow;
            _logger.LogInformation("Đã nạp {Count} từ khóa từ Redis vào Aho-Corasick Automaton trong RAM", patterns.Count);

            return _cachedAutomaton;
        }
        finally
        {
            _lock.Release();
        }
    }

    public Task InvalidateCacheAsync(CancellationToken ct = default)
    {
        _cachedAutomaton = null;
        _lastCacheTime = DateTime.MinValue;
        return Task.CompletedTask;
    }

    private static IReadOnlyList<string> LoadSeedKeywordsFromFile(string category)
    {
        try
        {
            var seedPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "moderation_seed_keywords.json");
            if (!File.Exists(seedPath))
            {
                seedPath = Path.Combine(Directory.GetCurrentDirectory(), "moderation_seed_keywords.json");
            }

            if (File.Exists(seedPath))
            {
                var json = File.ReadAllText(seedPath);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var propName = category.Equals("spam", StringComparison.OrdinalIgnoreCase) ? "spam" : "profanity";
                if (root.TryGetProperty(propName, out var arrayProp) && arrayProp.ValueKind == JsonValueKind.Array)
                {
                    var list = new List<string>();
                    foreach (var item in arrayProp.EnumerateArray())
                    {
                        var str = item.GetString();
                        if (!string.IsNullOrWhiteSpace(str)) list.Add(str);
                    }
                    return list;
                }
            }
        }
        catch
        {
        }

        return Array.Empty<string>();
    }
}
