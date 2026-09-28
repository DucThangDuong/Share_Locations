using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs.Admin;
using Application.Features.Admin.Users;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Users;

public class GetAdminUsersRequest
{
    public string? Role { get; set; }
    public int? CategoryId { get; set; }
    public int? RegionId { get; set; }
    public int? ProvinceId { get; set; }
    public long? PlaceId { get; set; }
    public int? Status { get; set; }
    public string? Keyword { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetAdminUsersEndpoint : Endpoint<GetAdminUsersRequest, ApiSuccessResponse<IReadOnlyList<AdminUserListItemDto>>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/users");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách tài khoản người dùng và quản trị viên (Admin)";
            s.Description = "Danh sách tài khoản hỗ trợ lọc theo vai trò (User, Admin cấp 1, SystemAdmin) hoặc theo danh mục, vùng, tỉnh, và địa điểm mà Admin cấp 1 đang quản trị.";
        });
    }

    public override async Task HandleAsync(GetAdminUsersRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new GetAdminUsersQuery(
                req.Role,
                req.CategoryId,
                req.RegionId,
                req.ProvinceId,
                req.PlaceId,
                req.Status,
                req.Keyword,
                req.Page,
                req.PageSize), ct);

        await this.SendPagedApiResponseAsync(result, ct);
    }
}
