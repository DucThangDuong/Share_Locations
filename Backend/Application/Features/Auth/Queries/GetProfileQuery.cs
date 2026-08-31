using Application.Common;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Queries;

public record GetProfileQuery(long UserId) : IRequest<Result<UserDto>>;

public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, Result<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetProfileQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UserDto>> Handle(GetProfileQuery request, CancellationToken ct)
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

        var userDto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.Profile?.FullName ?? user.Email,
            AvatarUrl = user.Profile?.AvatarUrl,
            CoverUrl = user.Profile?.CoverUrl,
            Bio = user.Profile?.Bio,
            Phone = user.Profile?.Phone,
            Role = user.Role,
            Status = user.Status,
            RankLevel = user.Profile?.RankLevel ?? "Tân binh",
            ReputationScore = user.Profile?.ReputationScore ?? 0
        };

        return Result<UserDto>.Success(userDto, "Lấy thông tin hồ sơ cá nhân thành công.");
    }
}
