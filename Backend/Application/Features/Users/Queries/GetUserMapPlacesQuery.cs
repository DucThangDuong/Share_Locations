using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Users.Queries;

public record GetUserMapPlacesQuery(long TargetUserId, long? CurrentUserId) : IRequest<Result<IReadOnlyList<UserMapPlaceDto>>>;

public class GetUserMapPlacesQueryHandler : IRequestHandler<GetUserMapPlacesQuery, Result<IReadOnlyList<UserMapPlaceDto>>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetUserMapPlacesQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<IReadOnlyList<UserMapPlaceDto>>> Handle(GetUserMapPlacesQuery request, CancellationToken ct)
    {
        bool isCurrentUser = request.CurrentUserId.HasValue && request.CurrentUserId.Value == request.TargetUserId;
        var places = await _repo.GetMapPlacesAsync(request.TargetUserId, isCurrentUser, ct);
        return Result<IReadOnlyList<UserMapPlaceDto>>.Success(places, "Lấy danh sách điểm bản đồ thành công.");
    }
}
