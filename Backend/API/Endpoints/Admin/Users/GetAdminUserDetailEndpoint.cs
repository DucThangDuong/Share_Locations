using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Users;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Users;

public class GetAdminUserDetailRequest
{
    public long UserId { get; set; }
}

public class GetAdminUserDetailEndpoint : Endpoint<GetAdminUserDetailRequest, ApiSuccessResponse<AdminUserDetailDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/users/{userId}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy thông tin chi tiết một tài khoản (User hoặc Admin cấp 1)";
            s.Description = "Admin tổng xem được toàn bộ. Admin cấp 1 chỉ xem được thông tin của User thường hoặc của chính mình. Đối với Admin cấp 1 sẽ trả kèm phân quyền và số liệu kiểm duyệt.";
        });
    }

    public override async Task HandleAsync(GetAdminUserDetailRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetAdminUserDetailQuery(req.UserId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
