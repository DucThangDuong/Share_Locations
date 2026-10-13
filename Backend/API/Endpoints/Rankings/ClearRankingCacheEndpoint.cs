using API.DTOs;
using API.Extensions;
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
            s.Summary = "Xóa cache và ép tính toán lại Bảng Xếp Hạng";
            s.Description = "Dành riêng cho Quản trị viên hệ thống (SystemAdmin) để làm mới toàn bộ dữ liệu bảng xếp hạng tức thì sau khi có cập nhật dữ liệu lớn.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await Mediator.Send(new ClearRankingCacheCommand(), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
