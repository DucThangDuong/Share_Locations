using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace API.Configurations;

public static class AuthenticationConfig
{
    public static IServiceCollection AddAppJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSecret = configuration["Jwt:SecretKey"] 
            ?? throw new InvalidOperationException("CRITICAL: JWT SecretKey is not configured!");
        var jwtIssuer = configuration["Jwt:Issuer"] 
            ?? throw new InvalidOperationException("CRITICAL: JWT Issuer is not configured!");
        var jwtAudience = configuration["Jwt:Audience"] 
            ?? throw new InvalidOperationException("CRITICAL: JWT Audience is not configured!");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            var isDevelopment = string.Equals(configuration["ASPNETCORE_ENVIRONMENT"], "Development", StringComparison.OrdinalIgnoreCase);
            options.RequireHttpsMetadata = !isDevelopment;
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

            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var tokenCache = context.HttpContext.RequestServices.GetRequiredService<ITokenCacheService>();
                    var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value
                           ?? context.Principal?.FindFirst("jti")?.Value;

                    if (!string.IsNullOrEmpty(jti) && await tokenCache.IsAccessTokenBlacklistedAsync(jti))
                    {
                        context.Fail("This token has been revoked.");
                    }
                }
            };
        });

        services.AddAuthorization();

        return services;
    }
}
