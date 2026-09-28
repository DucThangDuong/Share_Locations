using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Users;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Users;

public class UpdateAdminUserScopesApiRequest
{
    public long UserId { get; set; }
    public List<int> CategoryIds { get; set; } = new();
    public List<int> ProvinceIds { get; set; } = new();
    public List<int>? RegionIds { get; set; }
    public string? Note { get; set; }
}

public class UpdateAdminUserScopesEndpoint : Endpoint<UpdateAdminUserScopesApiRequest, ApiSuccessResponse<UpdateAdminScopesResponseDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/admin/users/{userId}/scopes");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Cập nhật / Gán phạm vi phân quyền cho Admin cấp 1";
            s.Description = "Chỉ SystemAdmin mới có quyền gán danh mục và tỉnh thành phụ trách cho Admin cấp 1.";
        });
    }

    public override async Task HandleAsync(UpdateAdminUserScopesApiRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(
            new UpdateAdminUserScopesCommand(
                req.UserId,
                req.CategoryIds,
                req.ProvinceIds,
                req.RegionIds,
                req.Note), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
