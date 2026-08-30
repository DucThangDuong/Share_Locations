using Infrastructure.Persistence;

namespace API.Configurations;

public static class DatabaseConfig
{
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<Program>>();

        try
        {
            var dbContext = services.GetRequiredService<TravelReviewDbContext>();
            logger.LogInformation("Đang kiểm tra và tự động khởi tạo database / bảng từ Entities...");
            await dbContext.Database.EnsureCreatedAsync();
            logger.LogInformation("Khởi tạo database và bảng thành công!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi trong quá trình tự động khởi tạo bảng database.");
        }
    }
}
