using Application.Common;
using Application.Common.Interfaces;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands;

public record UpdateProfileCommand(
    long UserId,
    string? FullName = null,
    string? Phone = null,
    string? Bio = null,
    FileUploadModel? AvatarFile = null,
    FileUploadModel? CoverFile = null) : IRequest<Result<UserDto>>;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBlobService _blobService;

    public UpdateProfileCommandHandler(IUnitOfWork unitOfWork, IBlobService blobService)
    {
        _unitOfWork = unitOfWork;
        _blobService = blobService;
    }

    public async Task<Result<UserDto>> Handle(UpdateProfileCommand request, CancellationToken ct)
    {
        var user = await _unitOfWork.Users.GetByIdWithProfileAsync(request.UserId, ct);
        if (user == null || user.IsDeleted)
        {
            return Result<UserDto>.NotFound("Người dùng không tồn tại hoặc đã bị xóa.");
        }

        if (user.Status == UserStatus.Banned)
        {
            return Result<UserDto>.Forbidden("Tài khoản của bạn đã bị khóa.");
        }

        if (user.Status == UserStatus.Inactive)
        {
            return Result<UserDto>.Forbidden("Tài khoản của bạn chưa được kích hoạt.");
        }

        string? avatarUrl = null;
        if (request.AvatarFile != null && request.AvatarFile.Content.Length > 0)
        {
            avatarUrl = await _blobService.UploadImageAsync(
                request.AvatarFile.Content,
                request.AvatarFile.FileName,
                request.AvatarFile.ContentType,
                "avatar",
                ct);
        }

        string? coverUrl = null;
        if (request.CoverFile != null && request.CoverFile.Content.Length > 0)
        {
            coverUrl = await _blobService.UploadImageAsync(
                request.CoverFile.Content,
                request.CoverFile.FileName,
                request.CoverFile.ContentType,
                "covers",
                ct);
        }

        if (user.Profile == null)
        {
            var newProfile = new UserProfile(
                user.Id,
                request.FullName ?? user.Email,
                avatarUrl: avatarUrl,
                phone: request.Phone);

            if (!string.IsNullOrWhiteSpace(coverUrl))
                newProfile.SetCoverUrl(coverUrl);

            if (!string.IsNullOrWhiteSpace(request.Bio))
                newProfile.SetBio(request.Bio);

            await _unitOfWork.UserProfiles.AddAsync(newProfile, ct);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.Profile.SetFullName(request.FullName);

            if (request.Phone != null)
                user.Profile.SetPhone(request.Phone);

            if (!string.IsNullOrWhiteSpace(avatarUrl))
                user.Profile.SetAvatarUrl(avatarUrl);

            if (!string.IsNullOrWhiteSpace(coverUrl))
                user.Profile.SetCoverUrl(coverUrl);

            if (request.Bio != null)
                user.Profile.SetBio(request.Bio);

            _unitOfWork.UserProfiles.Update(user.Profile);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.Profile?.FullName ?? request.FullName ?? user.Email,
            AvatarUrl = user.Profile?.AvatarUrl,
            CoverUrl = user.Profile?.CoverUrl,
            Bio = user.Profile?.Bio,
            Phone = user.Profile?.Phone,
            Role = user.Role,
            Status = user.Status,
            RankLevel = user.Profile?.RankLevel ?? "Tân binh",
            ReputationScore = user.Profile?.ReputationScore ?? 0
        };

        return Result<UserDto>.Success(userDto, "Cập nhật thông tin hồ sơ thành công.");
    }
}
