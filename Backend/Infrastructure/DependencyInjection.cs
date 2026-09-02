using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SqlServer")
            ?? "Server=localhost;Database=TravelReviewDB;Trusted_Connection=True;TrustServerCertificate=True";

        services.AddDbContext<TravelReviewDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorNumbersToAdd: null);
            });
        });

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IRegionRepository, RegionRepository>();
        services.AddScoped<IProvinceRepository, ProvinceRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ICollectionRepository, CollectionRepository>();
        services.AddScoped<IPlaceRepository, PlaceRepository>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        services.AddScoped<ITokenCacheService, TokenCacheService>();
        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<IBlobService, AzureBlobService>();

        var redisConn = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConn))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConn;
                options.InstanceName = "TravelReview_";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        return services;
    }
}
