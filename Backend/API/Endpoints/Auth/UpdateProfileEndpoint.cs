using System.Security.Claims;
using API.DTOs;
using API.DTOs.Auth;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Auth.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Auth;

public class UpdateProfileEndpoint : Endpoint<UpdateProfileRequest, ApiSuccessResponse<UserDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Put("/api/v1/auth/profile", "/api/auth/profile");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        AllowFileUploads();
    }

    public override async Task HandleAsync(UpdateProfileRequest req, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!long.TryParse(userIdStr, out var userId))
        {
            await this.SendApiResponseAsync(
                Result<UserDto>.Unauthorized("Không tìm thấy thông tin xác thực hợp lệ."),
                ct);
            return;
        }

        FileUploadModel? avatarFile = null;
        if (req.AvatarFile != null && req.AvatarFile.Length > 0)
        {
            avatarFile = new FileUploadModel(
                req.AvatarFile.OpenReadStream(),
                req.AvatarFile.FileName,
                req.AvatarFile.ContentType);
        }

        FileUploadModel? coverFile = null;
        if (req.CoverFile != null && req.CoverFile.Length > 0)
        {
            coverFile = new FileUploadModel(
                req.CoverFile.OpenReadStream(),
                req.CoverFile.FileName,
                req.CoverFile.ContentType);
        }

        var command = new UpdateProfileCommand(
            userId,
            req.FullName,
            req.Phone,
            req.Bio,
            avatarFile,
            coverFile);

        var result = await Mediator.Send(command, ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
