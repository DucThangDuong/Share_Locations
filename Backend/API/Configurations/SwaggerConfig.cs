using FastEndpoints.Swagger;
using NSwag;

namespace API.Configurations;

public static class SwaggerConfig
{
    public static IServiceCollection AddAppSwagger(this IServiceCollection services)
    {
        services.SwaggerDocument(o =>
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
                    Description = "Nhập trực tiếp JWT Access Token của bạn (KHÔNG gõ chữ 'Bearer ')"
                });
            };
        });

        return services;
    }
}
