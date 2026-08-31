using System.Net;

namespace API.DTOs;

public class ApiSuccessResponse<T>
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public ApiSuccessResponse() { }

    public ApiSuccessResponse(T? data, string message = "Thành công")
    {
        Success = true;
        Message = message;
        Data = data;
        Timestamp = DateTime.UtcNow;
    }
}

public class ApiErrorResponse
{
    public bool Success { get; set; } = false;
    public string Message { get; set; } = string.Empty;
    public HttpStatusCode StatusCode { get; set; }
    public IReadOnlyList<string> Errors { get; set; } = new List<string>();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public ApiErrorResponse(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest, IEnumerable<string>? errors = null)
    {
        Success = false;
        Message = message;
        StatusCode = statusCode;
        Errors = errors?.ToList() ?? new List<string>();
        Timestamp = DateTime.UtcNow;
    }
}
