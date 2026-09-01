using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace API.Configurations;

public static class AuthenticationConfig
{
    public static IServiceCollection AddAppJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSecret = string.IsNullOrWhiteSpace(configuration["Jwt:SecretKey"])
            ? "SuperSecretKeyForTravelReviewPlatform2026!MustBeLongEnough"
            : configuration["Jwt:SecretKey"]!;
        var jwtIssuer = string.IsNullOrWhiteSpace(configuration["Jwt:Issuer"])
            ? "TravelReviewBackend"
            : configuration["Jwt:Issuer"]!;
        var jwtAudience = string.IsNullOrWhiteSpace(configuration["Jwt:Audience"])
            ? "TravelReviewClient"
            : configuration["Jwt:Audience"]!;

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization();

        return services;
    }
}
