namespace Application.DTOs;

public record FileUploadModel(
    Stream Content,
    string FileName,
    string ContentType
);
