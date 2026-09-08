namespace Application.Common.Interfaces;

public interface IBlobService
{
    Task<string> UploadImageAsync(
        Stream stream,
        string fileName,
        string contentType,
        string containerName = "images",
        CancellationToken ct = default);

    Task<string> UploadVideoAsync(
        Stream stream,
        string fileName,
        string contentType,
        string containerName = "videos",
        CancellationToken ct = default);

    Task<bool> DeleteImageAsync(
        string blobUrlOrName,
        string containerName = "images",
        CancellationToken ct = default);
}
