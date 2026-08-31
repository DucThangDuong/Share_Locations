namespace API.Configurations;

public static class CorsConfig
{
    public const string PolicyName = "AllowAll";

    public static IServiceCollection AddAppCors(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                policy.SetIsOriginAllowed(origin => true)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

        return services;
    }
}
