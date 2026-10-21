using Application.Common.Interfaces;
using Infrastructure.Caching.Configuration;
using Infrastructure.Caching.Connection;
using Infrastructure.Caching.Services;
using Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Caching.DependencyInjection;

public static class RedisServiceExtensions
{
    public static IServiceCollection AddEnterpriseRedis(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<RedisOptions>()
            .Bind(configuration.GetSection(RedisOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton<IRedisConnectionProvider, ResilientRedisConnectionProvider>();
        services.AddSingleton<IEnterpriseCacheService, EnterpriseRedisService>();

        services.AddSingleton<ICacheService, CacheService>();

        return services;
    }
}
