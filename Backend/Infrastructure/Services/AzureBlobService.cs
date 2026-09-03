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

        string safeFileName = Path.GetFileName(fileName);
        string fileExtension = Path.GetExtension(safeFileName).ToLowerInvariant();

        if (string.IsNullOrEmpty(fileExtension) || !AllowedExtensions.Contains(fileExtension))
        {
            throw new ArgumentException($"Định dạng tệp '{fileExtension}' không được hỗ trợ. Chỉ chấp nhận .jpg, .jpeg, .png, .webp.");
        }

        if (!ValidateImageMagicBytes(stream, out var verifiedContentType))
        {
            throw new ArgumentException("Nội dung tệp không hợp lệ hoặc không phải là hình ảnh được hỗ trợ.");
        }

        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName.ToLower());
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: ct);

        string uniqueFileName = $"{Guid.NewGuid():N}{fileExtension}";
        var blobClient = containerClient.GetBlobClient(uniqueFileName);

        var blobHttpHeaders = new BlobHttpHeaders
        {
            ContentType = verifiedContentType
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

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private static bool ValidateImageMagicBytes(Stream stream, out string detectedContentType)
    {
        detectedContentType = string.Empty;
        if (!stream.CanSeek)
        {
            return false;
        }

        var originalPosition = stream.Position;
        stream.Position = 0;

        try
        {
            var header = new byte[12];
            var bytesRead = stream.Read(header, 0, header.Length);
            if (bytesRead < 4)
            {
                return false;
            }

            // JPEG: FF D8 FF
            if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            {
                detectedContentType = "image/jpeg";
                return true;
            }

            // PNG: 89 50 4E 47 0D 0A 1A 0A
            if (bytesRead >= 8 &&
                header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 &&
                header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
            {
                detectedContentType = "image/png";
                return true;
            }

            // WebP: RIFF .... WEBP
            if (bytesRead >= 12 &&
                header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
                header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
            {
                detectedContentType = "image/webp";
                return true;
            }

            return false;
        }
        finally
        {
            stream.Position = originalPosition;
        }
    }
}
