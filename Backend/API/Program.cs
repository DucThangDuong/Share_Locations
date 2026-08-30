using System.Text.Json;
using API.Configurations;
using API.DTOs;
using Application;
using FastEndpoints;
using FastEndpoints.Swagger;
using Infrastructure;

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

        // 1. Clean Architecture Layers
        builder.Services.AddApplication();
        builder.Services.AddInfrastructure(builder.Configuration);

        // 2. Global Exception Handler & ProblemDetails
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
        builder.Services.AddProblemDetails();

        // 3. Modular Configurations
        builder.Services.AddAppJwtAuthentication(builder.Configuration);
        builder.Services.AddAppRateLimiting();
        builder.Services.AddAppCors();
        builder.Services.AddAppSwagger();
        builder.Services.AddFastEndpoints();

        var app = builder.Build();

        // 4. Database Auto-Initialization
        await app.InitializeDatabaseAsync();

        // 5. Middleware Pipeline
        app.UseExceptionHandler();
        app.UseAppLocalization();

        app.UseHttpsRedirection();
        app.UseCors(CorsConfig.PolicyName);

        app.UseRateLimiter();

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseFastEndpoints(c =>
        {
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
