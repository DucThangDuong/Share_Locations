using FastEndpoints;
using FastEndpoints.Swagger;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace API;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.WebHost.ConfigureKestrel(serverOptions =>
        {
            serverOptions.AddServerHeader = false;
        });

        builder.Services.AddProblemDetails();
        builder.Services.AddFastEndpoints();
        builder.Services.SwaggerDocument();

        var connectionString = builder.Configuration.GetConnectionString("SqlServer") ??
            throw new InvalidOperationException("Connection string 'SqlServer' was not found in configuration.");

        builder.Services.AddDbContext<TravelReviewDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            });
        });

        var app = builder.Build();

        // Tự động kiểm tra và tạo toàn bộ 34 bảng từ Domain Entities & DbContext khi chạy
        using (var scope = app.Services.CreateScope())
        {
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

        var supportedCultures = new[] { "vi", "en" };
        var localizationOptions = new RequestLocalizationOptions()
            .SetDefaultCulture(supportedCultures[0])
            .AddSupportedCultures(supportedCultures)
            .AddSupportedUICultures(supportedCultures);

        app.UseExceptionHandler();
        app.UseRequestLocalization(localizationOptions);

        app.UseHttpsRedirection();

        app.UseFastEndpoints();
        app.UseSwaggerGen();

        await app.RunAsync();
    }
}
