using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace API.Configurations;

public static class RateLimiterConfig
{
    public static IServiceCollection AddAppRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddFixedWindowLimiter("auth_strict", opt =>
            {
                opt.PermitLimit = 15;
                opt.Window = TimeSpan.FromMinutes(1);
                opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 0;
            });
        });

        return services;
    }
}
