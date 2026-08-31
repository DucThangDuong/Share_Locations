using System.Net;
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
        if (result.IsSuccess)
        {
            var successResponse = new ApiSuccessResponse<T>(result.Data, result.Message);
            var statusCode = (int)result.StatusCode;
            await endpoint.HttpContext.Response.SendAsync(successResponse, statusCode, cancellation: ct);
            return;
        }

        var errorResponse = new ApiErrorResponse(result.Message, result.StatusCode, result.Errors);
        await endpoint.HttpContext.Response.SendAsync(errorResponse, (int)result.StatusCode, cancellation: ct);
    }

    public static async Task SendApiResponseAsync(
        this IEndpoint endpoint,
        Result result,
        CancellationToken ct = default)
    {
        if (result.IsSuccess)
        {
            var successResponse = new ApiSuccessResponse<object?>(null, result.Message);
            var statusCode = (int)result.StatusCode;
            await endpoint.HttpContext.Response.SendAsync(successResponse, statusCode, cancellation: ct);
            return;
        }

        var errorResponse = new ApiErrorResponse(result.Message, result.StatusCode, result.Errors);
        await endpoint.HttpContext.Response.SendAsync(errorResponse, (int)result.StatusCode, cancellation: ct);
    }
}
