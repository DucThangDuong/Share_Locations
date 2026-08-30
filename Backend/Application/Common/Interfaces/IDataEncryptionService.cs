namespace Application.Common.Interfaces;

public interface IDataEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
    string ComputeBlindIndex(string plainText);
    string HashToken(string token);
}
