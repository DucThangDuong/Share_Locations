using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Users;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Users;

public class UpdateAdminUserRoleApiRequest
{
    public long UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public List<int>? CategoryIds { get; set; }
    public List<int>? ProvinceIds { get; set; }
    public List<int>? RegionIds { get; set; }
    public string? Reason { get; set; }
}

public class UpdateAdminUserRoleEndpoint : Endpoint<UpdateAdminUserRoleApiRequest, ApiSuccessResponse<UpdateAdminUserRoleResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/users/{userId}/role");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Gán quyền / Giảm quyền / Đổi vai trò tài khoản";
            s.Description = "Chỉ SystemAdmin mới có quyền thăng cấp hoặc hạ cấp người dùng (User, CategoryAdmin, SystemAdmin).";
        });
    }

    public override async Task HandleAsync(UpdateAdminUserRoleApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new UpdateAdminUserRoleCommand(
                req.UserId,
                req.Role,
                req.CategoryIds,
                req.ProvinceIds,
                req.RegionIds,
                req.Reason), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
