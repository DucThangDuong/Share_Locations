using System.Net;
using System.Text.Json;
using API.DTOs;
using Microsoft.AspNetCore.Diagnostics;

namespace API.Configurations;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var requestId = httpContext.TraceIdentifier;
        var path = httpContext.Request.Path.Value ?? string.Empty;

        _logger.LogError(exception, "Unhandled Exception occurred on {Path}. RequestId: {RequestId}", path, requestId);

        httpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        httpContext.Response.ContentType = "application/json";

        var response = new ApiErrorResponse(
            code: "INTERNAL_SERVER_ERROR",
            message: "Đã xảy ra lỗi trong quá trình xử lý yêu cầu. Vui lòng thử lại sau.",
            path: path,
            requestId: requestId
        );

        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);
        return true;
    }
}
