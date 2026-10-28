using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Rankings.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Rankings;

public class ClearRankingCacheEndpoint : EndpointWithoutRequest<ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/admin/rankings/clear-cache");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Đồng bộ và tính toán lại Bảng Xếp Hạng (kèm lưu Snapshot thứ hạng)";
            s.Description = "Lưu snapshot thứ hạng kỳ trước vào DB, giải phóng Redis cache và ép hệ thống tính toán lại toàn bộ Bảng xếp hạng.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new ClearRankingCacheCommand(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}

public class GetAdminRankingConfigEndpoint : EndpointWithoutRequest<ApiSuccessResponse<RankingGovernanceConfigDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/rankings/config");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Lấy cấu hình trọng số thuật toán, ghim và loại trừ Bảng xếp hạng";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetRankingGovernanceConfigQuery(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}

public class UpdateAdminRankingConfigEndpoint : Endpoint<RankingGovernanceConfigDto, ApiSuccessResponse<RankingGovernanceConfigDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/rankings/config");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Summary(s =>
        {
            s.Summary = "Lưu cấu hình trọng số thuật toán, ngưỡng tối thiểu, ghim và loại trừ Bảng xếp hạng vào DB";
        });
    }

    public override async Task HandleAsync(RankingGovernanceConfigDto req, CancellationToken ct)
    {
        var result = await Mediator.Send(new UpdateRankingGovernanceConfigCommand(req), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
