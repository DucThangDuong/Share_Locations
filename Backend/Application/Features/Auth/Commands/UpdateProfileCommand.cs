using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands;

public record UpdateProfileCommand(
    long UserId,
    string FullName,
    string? Phone,
    string? AvatarUrl,
    string? CoverUrl,
    string? Bio) : IRequest<Result<UserDto>>;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateProfileCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        if (user.Profile == null)
        {
            var newProfile = new UserProfile(
                user.Id,
                request.FullName,
                avatarUrl: request.AvatarUrl,
                phone: request.Phone);

            if (!string.IsNullOrWhiteSpace(request.CoverUrl) || !string.IsNullOrWhiteSpace(request.Bio))
            {
                newProfile.UpdateProfile(request.FullName, request.Phone, request.AvatarUrl, request.CoverUrl, request.Bio);
            }

            await _unitOfWork.UserProfiles.AddAsync(newProfile, ct);
        }
        else
        {
            user.Profile.UpdateProfile(
                request.FullName,
                request.Phone,
                request.AvatarUrl,
                request.CoverUrl,
                request.Bio);

            _unitOfWork.UserProfiles.Update(user.Profile);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.Profile?.FullName ?? request.FullName,
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
