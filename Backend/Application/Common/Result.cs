using System.Net;

namespace Application.Common;

public class Result
{
    public bool IsSuccess { get; }
    public string Message { get; }
    public HttpStatusCode StatusCode { get; }
    public IReadOnlyList<string> Errors { get; }

    protected Result(bool isSuccess, string message, HttpStatusCode statusCode, IEnumerable<string>? errors = null)
    {
        IsSuccess = isSuccess;
        Message = message;
        StatusCode = statusCode;
        Errors = errors?.ToList() ?? new List<string>();
    }

    public static Result Success(string message = "Thành công", HttpStatusCode statusCode = HttpStatusCode.OK)
        => new(true, message, statusCode);

    public static Result Failure(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest, IEnumerable<string>? errors = null)
        => new(false, message, statusCode, errors);

    public static Result NotFound(string message = "Không tìm thấy dữ liệu")
        => new(false, message, HttpStatusCode.NotFound);

    public static Result Unauthorized(string message = "Không có quyền truy cập hoặc phiên làm việc hết hạn")
        => new(false, message, HttpStatusCode.Unauthorized);

    public static Result Forbidden(string message = "Bạn không có quyền thực hiện thao tác này")
        => new(false, message, HttpStatusCode.Forbidden);
}

public class Result<T> : Result
{
    public T? Data { get; }

    protected Result(bool isSuccess, T? data, string message, HttpStatusCode statusCode, IEnumerable<string>? errors = null)
        : base(isSuccess, message, statusCode, errors)
    {
        Data = data;
    }

    public static Result<T> Success(T data, string message = "Thành công", HttpStatusCode statusCode = HttpStatusCode.OK)
        => new(true, data, message, statusCode);

    public static new Result<T> Failure(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest, IEnumerable<string>? errors = null)
        => new(false, default, message, statusCode, errors);

    public static new Result<T> NotFound(string message = "Không tìm thấy dữ liệu")
        => new(false, default, message, HttpStatusCode.NotFound);

    public static new Result<T> Unauthorized(string message = "Không có quyền truy cập hoặc phiên làm việc hết hạn")
        => new(false, default, message, HttpStatusCode.Unauthorized);

    public static new Result<T> Forbidden(string message = "Bạn không có quyền thực hiện thao tác này")
        => new(false, default, message, HttpStatusCode.Forbidden);
}
