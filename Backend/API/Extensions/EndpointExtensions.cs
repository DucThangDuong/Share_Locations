using API.DTOs;
using Application.Common;
using FastEndpoints;

namespace API.Extensions;

public static class EndpointExtensions
{
    public static async Task SendApiResponseAsync<T>(
        this IEndpoint endpoint,
        Result<T> result,
        CancellationToken ct = default)
    {
        var httpContext = endpoint.HttpContext;
        var path = httpContext.Request.Path.Value ?? string.Empty;
        var requestId = httpContext.TraceIdentifier;

        if (result.IsSuccess)
        {
            var successResponse = new ApiSuccessResponse<T>(result.Data, result.Message);
            var statusCode = (int)result.StatusCode;
            await httpContext.Response.SendAsync(successResponse, statusCode, cancellation: ct);
            return;
        }

        var errorDetails = result.Errors.Count > 0
            ? result.Errors.Select(e => new ValidationErrorDetail(e.Field, e.Message, e.RejectedValue)).ToList()
            : null;

        var errorResponse = new ApiErrorResponse(
            code: result.ErrorCode,
            message: result.Message,
            path: path,
            requestId: requestId,
            errors: errorDetails
        );

        await httpContext.Response.SendAsync(errorResponse, (int)result.StatusCode, cancellation: ct);
    }

    public static async Task SendApiResponseAsync(
        this IEndpoint endpoint,
        Result result,
        CancellationToken ct = default)
    {
        var httpContext = endpoint.HttpContext;
        var path = httpContext.Request.Path.Value ?? string.Empty;
        var requestId = httpContext.TraceIdentifier;

        if (result.IsSuccess)
        {
            var successResponse = new ApiSuccessResponse<object?>(null, result.Message);
            var statusCode = (int)result.StatusCode;
            await httpContext.Response.SendAsync(successResponse, statusCode, cancellation: ct);
            return;
        }

        var errorDetails = result.Errors.Count > 0
            ? result.Errors.Select(e => new ValidationErrorDetail(e.Field, e.Message, e.RejectedValue)).ToList()
            : null;

        var errorResponse = new ApiErrorResponse(
            code: result.ErrorCode,
            message: result.Message,
            path: path,
            requestId: requestId,
            errors: errorDetails
        );

        await httpContext.Response.SendAsync(errorResponse, (int)result.StatusCode, cancellation: ct);
    }
}
