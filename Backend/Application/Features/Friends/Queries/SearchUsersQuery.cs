using Application.Common;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Friends.Queries;

public record SearchUsersQuery(long? CurrentUserId, string Keyword) : IRequest<Result<List<FriendItemDto>>>;

public class SearchUsersQueryHandler : IRequestHandler<SearchUsersQuery, Result<List<FriendItemDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public SearchUsersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<FriendItemDto>>> Handle(SearchUsersQuery request, CancellationToken ct)
    {
        var rawKeyword = (request.Keyword ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(rawKeyword))
        {
            return Result<List<FriendItemDto>>.Success(new List<FriendItemDto>(), "Vui lòng nhập từ khóa tìm kiếm.");
        }

        var users = await _unitOfWork.Users.SearchUsersAsync(rawKeyword, 30, ct);
        if (users.Count == 0)
        {
            return Result<List<FriendItemDto>>.Success(new List<FriendItemDto>(), "Không tìm thấy người dùng nào.");
        }

        List<Domain.Entities.Friendship> friendships = new();
        if (request.CurrentUserId.HasValue)
        {
            var currentUserId = request.CurrentUserId.Value;
            var allUserFriendships = await _unitOfWork.Friendships.GetUserFriendshipsAsync(currentUserId, ct);
            var targetIds = users.Select(u => u.Id).ToHashSet();
            friendships = allUserFriendships
                .Where(f => (f.User1Id == currentUserId && targetIds.Contains(f.User2Id)) ||
                            (f.User2Id == currentUserId && targetIds.Contains(f.User1Id)))
                .ToList();
        }

        var results = users.Select(u =>
        {
            var status = "none";
            DateTime? requestedAt = null;

            if (request.CurrentUserId.HasValue && u.Id == request.CurrentUserId.Value)
            {
                status = "self";
            }
            else if (request.CurrentUserId.HasValue)
            {
                var currentUserId = request.CurrentUserId.Value;
                var f = friendships.FirstOrDefault(x =>
                    (x.User1Id == currentUserId && x.User2Id == u.Id) ||
                    (x.User2Id == currentUserId && x.User1Id == u.Id));

                if (f != null)
                {
                    requestedAt = f.CreatedAt;
                    if (f.Status == FriendshipStatus.Accepted)
                    {
                        status = "accepted";
                    }
                    else if (f.Status == FriendshipStatus.Pending)
                    {
                        status = f.ActionUserId == currentUserId ? "pending_sent" : "pending_received";
                    }
                    else if (f.Status == FriendshipStatus.Blocked)
                    {
                        status = "blocked";
                    }
                }
            }

            return new FriendItemDto
            {
                Id = u.Id,
                Name = !string.IsNullOrWhiteSpace(u.Profile?.FullName) ? u.Profile.FullName : u.Email,
                Avatar = u.Profile?.AvatarUrl,
                CoverUrl = u.Profile?.CoverUrl,
                Email = u.Email,
                Bio = u.Profile?.Bio,
                RankLevel = u.Profile?.RankLevel,
                ReputationScore = u.Profile?.ReputationScore ?? 0,
                MutualFriendsCount = 0,
                TripsCount = u.Trips?.Count ?? 0,
                Status = status,
                RequestedAt = requestedAt
            };
        }).ToList();

        return Result<List<FriendItemDto>>.Success(results, "Tìm kiếm người dùng thành công.");
    }
}
