using System.Security.Cryptography;
using System.Text;
using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services;

public class DataEncryptionService : IDataEncryptionService
{
    private readonly byte[] _encryptionKey; // 32 bytes (256-bit)
    private readonly byte[] _blindIndexKey; // 32 bytes (256-bit)

    // Fallback static keys for local testing if not configured
    private const string DefaultDevKey = "q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c=";
    private const string DefaultDevBlindKey = "z0x1c2v3b4n5m6a7s8d9f0g1h2j3k4l5q6w7e8r9t0y=";

    public DataEncryptionService(IConfiguration configuration)
    {
        var keyBase64 = configuration["Security:EncryptionKey"] ?? DefaultDevKey;
        var blindKeyBase64 = configuration["Security:BlindIndexKey"] ?? DefaultDevBlindKey;

        _encryptionKey = Convert.FromBase64String(keyBase64);
        _blindIndexKey = Convert.FromBase64String(blindKeyBase64);

        if (_encryptionKey.Length != 32 || _blindIndexKey.Length != 32)
        {
            throw new ArgumentException("EncryptionKey and BlindIndexKey must be exactly 256 bits (32 bytes).");
        }
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return plainText;

        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var nonce = new byte[12]; // 96 bits nonce for GCM
        RandomNumberGenerator.Fill(nonce);

        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[16]; // 128 bits authentication tag

        using var aesGcm = new AesGcm(_encryptionKey, 16);
        aesGcm.Encrypt(nonce, plainBytes, cipherBytes, tag);

        // Format: [12 bytes Nonce] + [16 bytes Tag] + [Ciphertext]
        var result = new byte[12 + 16 + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, 12);
        Buffer.BlockCopy(tag, 0, result, 12, 16);
        Buffer.BlockCopy(cipherBytes, 0, result, 28, cipherBytes.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return cipherText;

        var fullCipher = Convert.FromBase64String(cipherText);
        if (fullCipher.Length < 28)
        {
            throw new CryptographicException("Invalid ciphertext payload: length too short for GCM nonce and tag.");
        }

        var nonce = new byte[12];
        var tag = new byte[16];
        var cipherBytes = new byte[fullCipher.Length - 28];

        Buffer.BlockCopy(fullCipher, 0, nonce, 0, 12);
        Buffer.BlockCopy(fullCipher, 12, tag, 0, 16);
        Buffer.BlockCopy(fullCipher, 28, cipherBytes, 0, cipherBytes.Length);

        var plainBytes = new byte[cipherBytes.Length];

        using var aesGcm = new AesGcm(_encryptionKey, 16);
        aesGcm.Decrypt(nonce, cipherBytes, tag, plainBytes);

        return Encoding.UTF8.GetString(plainBytes);
    }

    public string ComputeBlindIndex(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;

        var normalized = plainText.Trim().ToLowerInvariant();
        using var hmac = new HMACSHA256(_blindIndexKey);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public string HashToken(string token)
    {
        if (string.IsNullOrEmpty(token))
            return string.Empty;

        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
