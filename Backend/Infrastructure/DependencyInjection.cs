using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Domain.Interfaces;
using Infrastructure.Caching.DependencyInjection;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Services;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SqlServer")
            ?? throw new InvalidOperationException("CRITICAL: ConnectionStrings:SqlServer is not configured!");

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
        services.AddScoped<IPlaceTypeRepository, PlaceTypeRepository>();
        services.AddScoped<ICollectionRepository, CollectionRepository>();
        services.AddScoped<IPlaceRepository, PlaceRepository>();
        services.AddScoped<IFoodRepository, FoodRepository>();
        services.AddScoped<ITripRepository, TripRepository>();
        services.AddScoped<IBlogRepository, BlogRepository>();
        services.AddScoped<IUserPersonalizationRepository, UserPersonalizationRepository>();
        services.AddScoped<IChatRepository, ChatRepository>();
        services.AddScoped<IAdminReportRepository, AdminReportRepository>();
        services.AddScoped<IAdminProposalRepository, AdminProposalRepository>();
        services.AddScoped<IAdminPlaceRepository, AdminPlaceRepository>();
        services.AddScoped<IAdminReviewRepository, AdminReviewRepository>();
        services.AddScoped<IAdminFoodRepository, AdminFoodRepository>();
        services.AddScoped<IAdminBlogRepository, AdminBlogRepository>();
        services.AddScoped<IAdminDashboardRepository, AdminDashboardRepository>();
        services.AddScoped<IAdminUserRepository, AdminUserRepository>();
        services.AddScoped<IAdminAuditLogRepository, AdminAuditLogRepository>();
        services.AddScoped<IAdminGeographyRepository, AdminGeographyRepository>();
        services.AddScoped<IAdminCatalogTaxonomyRepository, AdminCatalogTaxonomyRepository>();
        services.AddScoped<IAdminSystemConfigRepository, AdminSystemConfigRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IRecommendationRepository, RecommendationRepository>();
        services.AddScoped<IRecommendationService, RecommendationService>();
        services.AddScoped<IRankingRepository, RankingRepository>();
        services.Configure<Application.DTOs.RecommendationOptions>(configuration.GetSection("RecommendationOptions"));
        services.AddMemoryCache();
        services.AddHostedService<Infrastructure.Workers.PlaceVectorSyncWorker>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IAuditLogService, AuditLogService>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        services.AddScoped<ITokenCacheService, TokenCacheService>();
        services.AddScoped<IBlobService, AzureBlobService>();
        services.AddScoped<IEmailService, EmailService>();

        // Tích hợp Enterprise Redis (Resilient Multiplexer, Striped Lock, Brotli, RateLimit, Distributed Lock, ACL)
        services.AddEnterpriseRedis(configuration);
        services.AddDistributedMemoryCache();

        services.AddMassTransit(x =>
        {
            x.SetKebabCaseEndpointNameFormatter();
            x.AddConsumer<Infrastructure.Consumers.SendForgotPasswordEmailConsumer>();

            x.UsingRabbitMq((context, cfg) =>
            {
                var host = configuration["RabbitMq:Host"] ?? "localhost";
                var portStr = configuration["RabbitMq:Port"];
                var port = ushort.TryParse(portStr, out var p) ? p : (ushort)5672;
                var username = configuration["RabbitMq:Username"] ?? "guest";
                var password = configuration["RabbitMq:Password"] ?? "guest";

                cfg.Host(host, port, "/", h =>
                {
                    h.Username(username);
                    h.Password(password);
                });

                cfg.UseMessageRetry(r => r.Exponential(3, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(15), TimeSpan.FromSeconds(2)));

                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
