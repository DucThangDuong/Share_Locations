using System.Text.Json;
using API.Configurations;
using API.DTOs;
using Application;
using FastEndpoints;
using FastEndpoints.Swagger;
using Infrastructure;
using Microsoft.AspNetCore.Http;
using Serilog;

namespace API;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Host.UseSerilog((context, services, configuration) => configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}"));

        builder.WebHost.ConfigureKestrel(serverOptions =>
        {
            serverOptions.AddServerHeader = false;
        });

        builder.Services.AddApplication();
        builder.Services.AddInfrastructure(builder.Configuration);
        builder.Services.AddAppHealthChecks(builder.Configuration);

        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
        builder.Services.AddProblemDetails();

        builder.Services.AddAppJwtAuthentication(builder.Configuration);
        builder.Services.AddAppRateLimiting();
        builder.Services.AddAppCors(builder.Configuration);
        builder.Services.AddAppSwagger();
        builder.Services.AddFastEndpoints();

        var app = builder.Build();

        app.UseSerilogRequestLogging();

        await app.InitializeDatabaseAsync();

        app.UseExceptionHandler();

        app.UseHttpsRedirection();
        app.UseCors(CorsConfig.PolicyName);

        app.MapAppHealthChecks();

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
