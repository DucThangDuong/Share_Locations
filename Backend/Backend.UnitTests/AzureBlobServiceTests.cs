using System.Text;
using FluentAssertions;
using Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class AzureBlobServiceTests
{
    private readonly IConfiguration _configuration = Substitute.For<IConfiguration>();
    private readonly ILogger<AzureBlobService> _logger = Substitute.For<ILogger<AzureBlobService>>();

    [Fact]
    public async Task UploadImageAsync_WhenExtensionNotAllowed_ShouldThrowArgumentException()
    {
        _configuration.GetConnectionString("AzureStorageAccount").Returns("UseDevelopmentStorage=true");
        var service = new AzureBlobService(_configuration, _logger);

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("malicious script"));

        Func<Task> act = async () => await service.UploadImageAsync(stream, "exploit.php", "image/jpeg");

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*không được hỗ trợ*");
    }

    [Fact]
    public async Task UploadImageAsync_WhenContentDoesNotMatchMagicBytes_ShouldThrowArgumentException()
    {
        _configuration.GetConnectionString("AzureStorageAccount").Returns("UseDevelopmentStorage=true");
        var service = new AzureBlobService(_configuration, _logger);

        // Disguised text file as .jpg
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("This is plain text disguised as JPEG"));

        Func<Task> act = async () => await service.UploadImageAsync(stream, "fake.jpg", "image/jpeg");

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Nội dung tệp không hợp lệ*");
    }
}
