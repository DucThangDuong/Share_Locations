using System.Text.Json.Serialization;

namespace API.DTOs;

public class PaginationMeta
{
    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("size")]
    public int Size { get; set; }

    [JsonPropertyName("totalElements")]
    public long TotalElements { get; set; }

    [JsonPropertyName("totalPages")]
    public int TotalPages { get; set; }

    public PaginationMeta() { }

    public PaginationMeta(int page, int size, long totalElements)
    {
        Page = page;
        Size = size;
        TotalElements = totalElements;
        TotalPages = size > 0 ? (int)Math.Ceiling((double)totalElements / size) : 0;
    }
}

public class ValidationErrorDetail
{
    [JsonPropertyName("field")]
    public string Field { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("rejectedValue")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? RejectedValue { get; set; }

    public ValidationErrorDetail() { }

    public ValidationErrorDetail(string field, string message, object? rejectedValue = null)
    {
        Field = field;
        Message = message;
        RejectedValue = rejectedValue;
    }
}

public class ApiSuccessResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("message")]
    public string Message { get; set; } = "Thao tác thành công";

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("meta")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public PaginationMeta? Meta { get; set; }

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

    public ApiSuccessResponse() { }

    public ApiSuccessResponse(T? data, string message = "Thao tác thành công", PaginationMeta? meta = null)
    {
        Success = true;
        Message = message;
        Data = data;
        Meta = meta;
        Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
    }
}

public class ApiErrorResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = false;

    [JsonPropertyName("code")]
    public string Code { get; set; } = "ERROR";

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("path")]
    public string Path { get; set; } = string.Empty;

    [JsonPropertyName("requestId")]
    public string RequestId { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

    [JsonPropertyName("errors")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<ValidationErrorDetail>? Errors { get; set; }

    public ApiErrorResponse() { }

    public ApiErrorResponse(
        string code,
        string message,
        string path,
        string requestId,
        IEnumerable<ValidationErrorDetail>? errors = null)
    {
        Success = false;
        Code = code;
        Message = message;
        Path = path;
        RequestId = requestId;
        Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
        var errorList = errors?.ToList();
        Errors = errorList != null && errorList.Count > 0 ? errorList : null;
    }
}
