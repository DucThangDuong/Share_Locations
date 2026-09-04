using System.Text.Json;
using System.Threading.RateLimiting;
using FastEndpoints.Swagger;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using NSwag;

namespace API.Configurations;

public static class AppServiceExtensions
{
    public const string CorsPolicy = "AllowSpecificOrigins";

    public static IServiceCollection AddAppCors(this IServiceCollection services, IConfiguration config)
    {
        var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        return services.AddCors(opt => opt.AddPolicy(CorsPolicy, p =>
        {
            if (origins.Length > 0) p.WithOrigins(origins);
            p.AllowAnyMethod().AllowAnyHeader().AllowCredentials();
        }));
    }

    public static IServiceCollection AddAppRateLimiting(this IServiceCollection services)
    {
        return services.AddRateLimiter(opt =>
        {
            opt.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            opt.AddFixedWindowLimiter("auth_strict", o =>
            {
                o.PermitLimit = 15;
                o.Window = TimeSpan.FromMinutes(1);
                o.QueueLimit = 0;
            });
            opt.AddFixedWindowLimiter("general_api", o =>
            {
                o.PermitLimit = 100;
                o.Window = TimeSpan.FromMinutes(1);
                o.QueueLimit = 0;
            });
        });
    }

    public static IServiceCollection AddAppSwagger(this IServiceCollection services)
    {
        return services.SwaggerDocument(o =>
        {
            o.EnableJWTBearerAuth = false;
            o.DocumentSettings = s =>
            {
                s.Title = "Hệ thống Chia sẻ Địa điểm API";
                s.Version = "v1";
                s.Description = "API tài liệu dành cho nền tảng đánh giá và chia sẻ địa điểm du lịch, ẩm thực.";
                s.AddAuth("Bearer", new()
                {
                    Type = OpenApiSecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    Description = "Nhập trực tiếp JWT Access Token (không gõ 'Bearer ')"
                });
            };
        });
    }

    public static IServiceCollection AddAppHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("sqlserver", tags: ["ready", "db"]);

        services.AddTransient<DatabaseHealthCheck>();
        return services;
    }

    public static IEndpointRouteBuilder MapAppHealthChecks(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
        endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = c => c.Tags.Contains("ready"),
            ResponseWriter = async (ctx, report) =>
            {
                ctx.Response.ContentType = "application/json";
                var result = new
                {
                    status = report.Status.ToString(),
                    durationMs = report.TotalDuration.TotalMilliseconds,
                    checks = report.Entries.Select(e => new
                    {
                        name = e.Key,
                        status = e.Value.Status.ToString(),
                        durationMs = e.Value.Duration.TotalMilliseconds,
                        description = e.Value.Description,
                        error = e.Value.Exception?.Message
                    })
                };
                await ctx.Response.WriteAsync(JsonSerializer.Serialize(result));
            }
        });
        return endpoints;
    }

    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        try
        {
            var db = scope.ServiceProvider.GetRequiredService<TravelReviewDbContext>();
            if (db.Database.GetMigrations().Any())
                await db.Database.MigrateAsync();
            else if (app.Environment.IsDevelopment())
                await db.Database.EnsureCreatedAsync();
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Lỗi khởi tạo database.");
        }
    }
}

public class DatabaseHealthCheck : IHealthCheck
{
    private readonly TravelReviewDbContext _db;

    public DatabaseHealthCheck(TravelReviewDbContext db)
    {
        _db = db;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _db.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("Database connection OK")
                : HealthCheckResult.Unhealthy("Cannot connect to Database");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database check failed", ex);
        }
    }
}
