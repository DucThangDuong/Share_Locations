using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common.Interfaces;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
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
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    var services = context.HttpContext.RequestServices;
                    var tokenCache = services.GetRequiredService<ITokenCacheService>();
                    var ct = context.HttpContext.RequestAborted;

                    var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value
                           ?? context.Principal?.FindFirst("jti")?.Value;

                    if (!string.IsNullOrEmpty(jti) && await tokenCache.IsAccessTokenBlacklistedAsync(jti, ct))
                    {
                        context.Fail("This token has been revoked.");
                        return;
                    }

                    var userIdStr = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                 ?? context.Principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                                 ?? context.Principal?.FindFirst("sub")?.Value;

                    if (!long.TryParse(userIdStr, out var userId))
                    {
                        context.Fail("Invalid user identifier.");
                        return;
                    }

                    var revokedAfterMs = await tokenCache.GetUserRevokedAfterMsAsync(userId, ct);
                    if (revokedAfterMs.HasValue)
                    {
                        var tokenTsClaim = context.Principal?.FindFirst("token_ts")?.Value;
                        var issuedAtMs = long.TryParse(tokenTsClaim, out var ts)
                            ? ts
                            : new DateTimeOffset(DateTime.SpecifyKind(context.SecurityToken.ValidFrom, DateTimeKind.Utc)).ToUnixTimeMilliseconds();

                        if (issuedAtMs <= revokedAfterMs.Value)
                        {
                            context.Fail("This session has been revoked.");
                            return;
                        }
                    }

                    var cachedStatus = await tokenCache.GetUserStatusAsync(userId, ct);
                    if (cachedStatus == "deleted" ||
                        (byte.TryParse(cachedStatus, out var cachedStatusByte) && cachedStatusByte != (byte)UserStatus.Active))
                    {
                        context.Fail("Account is inactive or locked.");
                        return;
                    }

                    if (cachedStatus == null)
                    {
                        var dbContext = services.GetRequiredService<TravelReviewDbContext>();
                        var userState = await dbContext.Users
                            .AsNoTracking()
                            .Where(u => u.Id == userId)
                            .Select(u => new { u.Status, u.IsDeleted })
                            .FirstOrDefaultAsync(ct);

                        var cacheVal = userState == null || userState.IsDeleted
                            ? "deleted"
                            : ((byte)userState.Status).ToString();

                        await tokenCache.SetUserStatusAsync(userId, cacheVal, TimeSpan.FromMinutes(1), ct);

                        if (userState == null || userState.IsDeleted || userState.Status != UserStatus.Active)
                        {
                            context.Fail("Account is inactive or locked.");
                        }
                    }
                }
            };
        });

        services.AddAuthorization();

        return services;
    }
}
