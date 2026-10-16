using Application.Common.Interfaces;
using Application.DTOs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Workers;

public class PlaceVectorSyncWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly RecommendationOptions _options;
    private readonly ILogger<PlaceVectorSyncWorker> _logger;

    public PlaceVectorSyncWorker(
        IServiceProvider serviceProvider,
        IOptions<RecommendationOptions> options,
        ILogger<PlaceVectorSyncWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PlaceVectorSyncWorker background service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var recService = scope.ServiceProvider.GetRequiredService<IRecommendationService>();

                var catalog = await recService.RefreshPlaceCatalogCacheAsync(stoppingToken);
                _logger.LogInformation(
                    "Synced PlaceVectorCatalog for {Count} places (MinReviews={Min}, MaxReviews={Max}).",
                    catalog.PlacesById.Count, catalog.MinReviewCount, catalog.MaxReviewCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while syncing PlaceVectorCatalog in PlaceVectorSyncWorker.");
            }

            var delayMinutes = _options.PlaceCatalogCacheMinutes > 0 ? _options.PlaceCatalogCacheMinutes : 15;
            await Task.Delay(TimeSpan.FromMinutes(delayMinutes), stoppingToken);
        }
    }
}
