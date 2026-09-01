using Application.Common.Interfaces;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class AzureBlobService : IBlobService
{
    private readonly BlobServiceClient? _blobServiceClient;
    private readonly ILogger<AzureBlobService> _logger;

    public AzureBlobService(IConfiguration configuration, ILogger<AzureBlobService> logger)
    {
        _logger = logger;
        string connectionString = configuration.GetConnectionString("AzureStorageAccount") ?? "";
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            _blobServiceClient = new BlobServiceClient(connectionString);
        }
        else
        {
            _logger.LogWarning("AzureStorageAccount connection string is not configured.");
        }
    }

    public async Task<string> UploadImageAsync(
        Stream stream,
        string fileName,
        string contentType,
        string containerName = "images",
        CancellationToken ct = default)
    {
        if (_blobServiceClient == null)
        {
            throw new InvalidOperationException("Azure Storage ConnectionString chưa được cấu hình.");
        }

        if (stream == null || stream.Length == 0)
        {
            throw new ArgumentException("Stream is null or empty.");
        }

        const long fileSizeLimit = 10 * 1024 * 1024;
        if (stream.Length > fileSizeLimit)
        {
            throw new ArgumentException("File size exceeds the limit of 10 MB.");
        }

        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: ct);

        string fileExtension = Path.GetExtension(fileName);
        string uniqueFileName = $"{Guid.NewGuid():N}{fileExtension}";
        var blobClient = containerClient.GetBlobClient(uniqueFileName);

        var blobHttpHeaders = new BlobHttpHeaders
        {
            ContentType = contentType
        };

        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        await blobClient.UploadAsync(stream, new BlobUploadOptions
        {
            HttpHeaders = blobHttpHeaders
        }, ct);

        return blobClient.Uri.ToString();
    }

    public async Task<string> UploadImageAsync(IFormFile file, string containerName = "images")
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("File is null or empty.");
        }

        await using var stream = file.OpenReadStream();
        return await UploadImageAsync(stream, file.FileName, file.ContentType, containerName);
    }

    public async Task<bool> DeleteImageAsync(string blobUrlOrName, string containerName = "images", CancellationToken ct = default)
    {
        if (_blobServiceClient == null) return false;

        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());
            var blobName = blobUrlOrName.Contains('/') ? Path.GetFileName(new Uri(blobUrlOrName).AbsolutePath) : blobUrlOrName;
            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: ct);
            return response.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete blob {BlobUrlOrName}.", blobUrlOrName);
            return false;
        }
    }
}
