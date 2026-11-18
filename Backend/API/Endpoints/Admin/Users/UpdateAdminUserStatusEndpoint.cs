using System.Net;
using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Users;
using Domain.Enums;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Users;

public class UpdateAdminUserStatusApiRequest
{
    public long UserId { get; set; }
    public string Status { get; set; } = "1";
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
        if (!TryParseUserStatus(req.Status, out var statusByte))
        {
            await this.SendApiResponseAsync(
                Result<bool>.Failure("Trạng thái tài khoản không hợp lệ. Chỉ chấp nhận Active (1), Inactive (0) hoặc Banned (2).", HttpStatusCode.BadRequest),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new UpdateAdminUserStatusCommand(
                req.UserId,
                statusByte,
                req.Reason), ct);

        await this.SendApiResponseAsync(result, ct);
    }

    private static bool TryParseUserStatus(string? rawStatus, out byte statusByte)
    {
        switch (rawStatus?.Trim().ToUpperInvariant())
        {
            case "1":
            case "ACTIVE":
                statusByte = (byte)UserStatus.Active;
                return true;
            case "0":
            case "INACTIVE":
                statusByte = (byte)UserStatus.Inactive;
                return true;
            case "2":
            case "BANNED":
            case "BAN":
            case "LOCK":
            case "LOCKED":
                statusByte = (byte)UserStatus.Banned;
                return true;
            default:
                statusByte = 0;
                return false;
        }
    }
}
