using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace API.Configurations;

public static class DatabaseConfig
{
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;

        try
        {
            var dbContext = services.GetRequiredService<TravelReviewDbContext>();

            // Chuẩn Big Tech: Dùng EF Core Migrations ở Production, tránh EnsureCreatedAsync
            if (dbContext.Database.GetMigrations().Any())
            {
                await dbContext.Database.MigrateAsync();
            }
            else if (app.Environment.IsDevelopment())
            {
                await dbContext.Database.EnsureCreatedAsync();
            }
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Lỗi trong quá trình khởi tạo/migrate database.");
        }
    }
}
