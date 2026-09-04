using API.DTOs;
using Application.Common;
using FastEndpoints;
using Microsoft.AspNetCore.Http;

namespace API.Extensions;

public static class EndpointExtensions
{
    public static Task SendApiResponseAsync<T>(this IEndpoint endpoint, Result<T> result, CancellationToken ct = default)
    {
        return result.IsSuccess
            ? endpoint.HttpContext.Response.SendAsync(new ApiSuccessResponse<T>(result.Data, result.Message), (int)result.StatusCode, cancellation: ct)
            : SendErrorAsync(endpoint.HttpContext, result, ct);
    }

    public static Task SendPagedApiResponseAsync<T>(this IEndpoint endpoint, Result<PagedResult<T>> result, CancellationToken ct = default)
    {
        if (result.IsSuccess && result.Data != null)
        {
            var meta = new PaginationMeta(result.Data.PageIndex, result.Data.PageSize, result.Data.TotalCount);
            return endpoint.HttpContext.Response.SendAsync(new ApiSuccessResponse<IReadOnlyList<T>>(result.Data.Items, result.Message, meta), (int)result.StatusCode, cancellation: ct);
        }

        return SendErrorAsync(endpoint.HttpContext, result, ct);
    }

    public static Task SendApiResponseAsync(this IEndpoint endpoint, Result result, CancellationToken ct = default)
    {
        return result.IsSuccess
            ? endpoint.HttpContext.Response.SendAsync(new ApiSuccessResponse<object?>(null, result.Message), (int)result.StatusCode, cancellation: ct)
            : SendErrorAsync(endpoint.HttpContext, result, ct);
    }

    private static Task SendErrorAsync(HttpContext ctx, Result result, CancellationToken ct)
    {
        var errorDetails = result.Errors.Count > 0
            ? result.Errors.Select(e => new ValidationErrorDetail(e.Field, e.Message, e.RejectedValue)).ToList()
            : null;

        var errorResponse = new ApiErrorResponse(
            code: result.ErrorCode,
            message: result.Message,
            path: ctx.Request.Path.Value ?? string.Empty,
            requestId: ctx.TraceIdentifier,
            errors: errorDetails
        );

        return ctx.Response.SendAsync(errorResponse, (int)result.StatusCode, cancellation: ct);
    }
}
