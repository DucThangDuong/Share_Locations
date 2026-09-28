using API.DTOs;
using API.Extensions;
using Application.Features.Admin.Users;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Users;

public class UpdateAdminUserStatusApiRequest
{
    public long UserId { get; set; }
    public string Status { get; set; } = "1"; // "1": Active, "0": Locked
    public string? Reason { get; set; }
}

public class UpdateAdminUserStatusEndpoint : Endpoint<UpdateAdminUserStatusApiRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Patch("/api/admin/users/{userId}/status");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Khóa hoặc mở khóa tài khoản";
            s.Description = "SystemAdmin có thể khóa mọi tài khoản. CategoryAdmin chỉ có quyền khóa người dùng thường (USER).";
        });
    }

    public override async Task HandleAsync(UpdateAdminUserStatusApiRequest req, CancellationToken ct)
    {
        byte statusByte = req.Status == "1" || req.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase) ? (byte)1 : (byte)2; // 1: Active, 2: Inactive/Banned

        var result = await Mediator.Send(
            new UpdateAdminUserStatusCommand(
                req.UserId,
                statusByte,
                req.Reason), ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
