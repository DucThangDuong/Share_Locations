using System.Net;

namespace Application.Common;

public class ValidationErrorItem
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public object? RejectedValue { get; set; }

    public ValidationErrorItem() { }

    public ValidationErrorItem(string field, string message, object? rejectedValue = null)
    {
        Field = field;
        Message = message;
        RejectedValue = rejectedValue;
    }
}

public class Result
{
    public bool IsSuccess { get; }
    public string Message { get; }
    public string ErrorCode { get; }
    public HttpStatusCode StatusCode { get; }
    public IReadOnlyList<ValidationErrorItem> Errors { get; }

    protected Result(
        bool isSuccess,
        string message,
        HttpStatusCode statusCode,
        string errorCode = "",
        IEnumerable<ValidationErrorItem>? errors = null)
    {
        IsSuccess = isSuccess;
        Message = message;
        StatusCode = statusCode;
        ErrorCode = string.IsNullOrWhiteSpace(errorCode) ? GetDefaultErrorCode(statusCode) : errorCode;
        Errors = errors?.ToList() ?? new List<ValidationErrorItem>();
    }

    private static string GetDefaultErrorCode(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.BadRequest => "BAD_REQUEST",
        HttpStatusCode.Unauthorized => "UNAUTHORIZED",
        HttpStatusCode.Forbidden => "FORBIDDEN",
        HttpStatusCode.NotFound => "NOT_FOUND",
        HttpStatusCode.UnprocessableEntity => "VALIDATION_ERROR",
        HttpStatusCode.InternalServerError => "INTERNAL_SERVER_ERROR",
        _ => "ERROR"
    };

    public static Result Success(string message = "Thành công", HttpStatusCode statusCode = HttpStatusCode.OK)
        => new(true, message, statusCode);

    public static Result Failure(
        string message,
        HttpStatusCode statusCode = HttpStatusCode.BadRequest,
        string errorCode = "BAD_REQUEST",
        IEnumerable<ValidationErrorItem>? errors = null)
        => new(false, message, statusCode, errorCode, errors);

    public static Result ValidationError(string message = "Dữ liệu không hợp lệ", IEnumerable<ValidationErrorItem>? errors = null)
        => new(false, message, HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", errors);

    public static Result NotFound(string message = "Không tìm thấy tài nguyên yêu cầu")
        => new(false, message, HttpStatusCode.NotFound, "NOT_FOUND");

    public static Result Unauthorized(string message = "Phiên làm việc đã hết hạn hoặc chưa được xác thực")
        => new(false, message, HttpStatusCode.Unauthorized, "UNAUTHORIZED");

    public static Result Forbidden(string message = "Bạn không có quyền thực hiện thao tác này")
        => new(false, message, HttpStatusCode.Forbidden, "FORBIDDEN");

}

public class Result<T> : Result
{
    public T? Data { get; }

    protected Result(
        bool isSuccess,
        T? data,
        string message,
        HttpStatusCode statusCode,
        string errorCode = "",
        IEnumerable<ValidationErrorItem>? errors = null)
        : base(isSuccess, message, statusCode, errorCode, errors)
    {
        Data = data;
    }

    public static Result<T> Success(T data, string message = "Thành công", HttpStatusCode statusCode = HttpStatusCode.OK)
        => new(true, data, message, statusCode);

    public static new Result<T> Failure(
        string message,
        HttpStatusCode statusCode = HttpStatusCode.BadRequest,
        string errorCode = "BAD_REQUEST",
        IEnumerable<ValidationErrorItem>? errors = null)
        => new(false, default, message, statusCode, errorCode, errors);

    public static new Result<T> ValidationError(string message = "Dữ liệu không hợp lệ", IEnumerable<ValidationErrorItem>? errors = null)
        => new(false, default, message, HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR", errors);

    public static new Result<T> NotFound(string message = "Không tìm thấy tài nguyên yêu cầu")
        => new(false, default, message, HttpStatusCode.NotFound, "NOT_FOUND");

    public static new Result<T> Unauthorized(string message = "Phiên làm việc đã hết hạn hoặc chưa được xác thực")
        => new(false, default, message, HttpStatusCode.Unauthorized, "UNAUTHORIZED");

    public static new Result<T> Forbidden(string message = "Bạn không có quyền thực hiện thao tác này")
        => new(false, default, message, HttpStatusCode.Forbidden, "FORBIDDEN");
}
