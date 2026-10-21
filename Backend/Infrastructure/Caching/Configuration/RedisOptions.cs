using System.ComponentModel.DataAnnotations;

namespace Infrastructure.Caching.Configuration;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";
    public bool Enabled { get; init; } = true;

    [Required(AllowEmptyStrings = false, ErrorMessage = "Phải cung cấp danh sách Endpoints của Redis.")]
    public string Endpoints { get; init; } = "localhost:6379";

    public string? AclUser { get; init; }
    public string? AclPassword { get; init; }

    [Required(AllowEmptyStrings = false)]
    [RegularExpression(@"^([a-z0-9_]+:)+$", ErrorMessage = "KeyPrefix chỉ gồm chữ thường, số, gạch dưới và kết thúc bằng dấu ':' (VD: 'prod:travel_svc:').")]
    public string InstanceKeyPrefix { get; init; } = "prod:travel_svc:";

    public bool UseTls { get; init; } = false;

    public string? TrustedIssuerCaCertPath { get; init; }
    public bool FailOpenOnCacheError { get; init; } = true;

    public bool FailOpenOnRateLimitError { get; init; } = false;

    [Range(500, 10000)]
    public int ConnectTimeoutMs { get; init; } = 3000;

    [Range(200, 5000)]
    public int SyncAndAsyncTimeoutMs { get; init; } = 1500;

    [Range(1024, 1048576)]
    public int MaxAllowedPayloadBytes { get; init; } = 262_144;

    [Range(512, 65536)]
    public int CompressionThresholdBytes { get; init; } = 4096;
}

