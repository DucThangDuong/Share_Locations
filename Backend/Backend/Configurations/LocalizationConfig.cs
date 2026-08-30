namespace API.Configurations;

public static class LocalizationConfig
{
    public static WebApplication UseAppLocalization(this WebApplication app)
    {
        var supportedCultures = new[] { "vi", "en" };
        var localizationOptions = new RequestLocalizationOptions()
            .SetDefaultCulture(supportedCultures[0])
            .AddSupportedCultures(supportedCultures)
            .AddSupportedUICultures(supportedCultures);

        app.UseRequestLocalization(localizationOptions);

        return app;
    }
}
