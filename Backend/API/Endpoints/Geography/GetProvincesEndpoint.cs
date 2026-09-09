using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Geography.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Geography;

public class GetProvincesEndpoint : EndpointWithoutRequest<ApiSuccessResponse<IReadOnlyList<ProvinceDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/provinces", "/api/provinces");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách tỉnh thành";
            s.Description = "Lấy danh sách các tỉnh/thành phố trên cả nước kèm thông tin mã vùng miền tương ứng.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetProvincesQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
