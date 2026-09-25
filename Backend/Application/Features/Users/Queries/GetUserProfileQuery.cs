using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserProfileQuery(long TargetUserId, long? CurrentUserId) : IRequest<Result<UserProfileDetailDto>>;

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, Result<UserProfileDetailDto>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserProfileQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<UserProfileDetailDto>> Handle(GetUserProfileQuery request, CancellationToken ct)
    {
        var profile = await _repo.GetUserProfileAsync(request.TargetUserId, request.CurrentUserId, ct);
        if (profile == null)
        {
            return Result<UserProfileDetailDto>.NotFound("Không tìm thấy thông tin người dùng.");
        }

        return Result<UserProfileDetailDto>.Success(profile, "Lấy thông tin hồ sơ người dùng thành công.");
    }
}
