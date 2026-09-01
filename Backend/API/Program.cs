using System.Text.Json;
using API.Configurations;
using API.DTOs;
using Application;
using FastEndpoints;
using FastEndpoints.Swagger;
using Infrastructure;
using Microsoft.AspNetCore.Http;

namespace API;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.WebHost.ConfigureKestrel(serverOptions =>
        {
            serverOptions.AddServerHeader = false;
        });

        builder.Services.AddApplication();
        builder.Services.AddInfrastructure(builder.Configuration);

        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
        builder.Services.AddProblemDetails();

        builder.Services.AddAppJwtAuthentication(builder.Configuration);
        builder.Services.AddAppRateLimiting();
        builder.Services.AddAppCors();
        builder.Services.AddAppSwagger();
        builder.Services.AddFastEndpoints();

        var app = builder.Build();

        await app.InitializeDatabaseAsync();

        app.UseExceptionHandler();

        app.UseHttpsRedirection();
        app.UseCors(CorsConfig.PolicyName);

        app.UseRateLimiter();

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseFastEndpoints(c =>
        {
            c.Binding.ValueParserFor<IFormFile>(input => new(true, null));

            c.Errors.ResponseBuilder = (failures, ctx, statusCode) =>
            {
                var errors = failures.Select(f => new ValidationErrorDetail(
                    field: JsonNamingPolicy.CamelCase.ConvertName(f.PropertyName),
                    message: f.ErrorMessage,
                    rejectedValue: f.AttemptedValue
                )).ToList();

                return new ApiErrorResponse(
                    code: "VALIDATION_ERROR",
                    message: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.",
                    path: ctx.Request.Path.Value ?? string.Empty,
                    requestId: ctx.TraceIdentifier,
                    errors: errors
                );
            };
            c.Errors.StatusCode = StatusCodes.Status422UnprocessableEntity;
        });

        app.UseSwaggerGen();

        await app.RunAsync();
    }
}
