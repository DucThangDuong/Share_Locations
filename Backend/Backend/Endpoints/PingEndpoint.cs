using FastEndpoints;

namespace Backend.Endpoints;

public class PingResponse
{
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class PingEndpoint : EndpointWithoutRequest<PingResponse>
{
    public override void Configure()
    {
        Get("/api/ping");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Kiểm tra trạng thái máy chủ";
            s.Description = "Endpoint trả về trạng thái hoạt động của hệ thống";
        });
    }

    public override Task HandleAsync(CancellationToken ct)
    {
        Response = new PingResponse
        {
            Message = "VietHeritagePedia API is running smoothly!"
        };
        return Task.CompletedTask;
    }
}
