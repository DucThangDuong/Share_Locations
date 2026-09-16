using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Friends.Queries;

public record GetMyFriendsQuery(long UserId) : IRequest<Result<FriendsResponseDto>>;

public class GetMyFriendsQueryHandler : IRequestHandler<GetMyFriendsQuery, Result<FriendsResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMyFriendsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<FriendsResponseDto>> Handle(GetMyFriendsQuery request, CancellationToken ct)
    {
        var friendships = await _unitOfWork.Friendships.GetUserFriendshipsAsync(request.UserId, ct);

        var response = new FriendsResponseDto();

        foreach (var f in friendships)
        {
            var otherUser = f.User1Id == request.UserId ? f.User2 : f.User1;
            if (otherUser == null) continue;

            var item = new FriendItemDto
            {
                Id = otherUser.Id,
                Name = !string.IsNullOrWhiteSpace(otherUser.Profile?.FullName) ? otherUser.Profile.FullName : otherUser.Email,
                Avatar = otherUser.Profile?.AvatarUrl,
                CoverUrl = otherUser.Profile?.CoverUrl,
                Email = otherUser.Email,
                Bio = otherUser.Profile?.Bio,
                RankLevel = otherUser.Profile?.RankLevel,
                ReputationScore = otherUser.Profile?.ReputationScore ?? 0,
                MutualFriendsCount = 0,
                TripsCount = otherUser.Trips?.Count ?? 0,
                RequestedAt = f.CreatedAt
            };

            if (f.Status == FriendshipStatus.Accepted)
            {
                item.Status = "accepted";
                response.Friends.Add(item);
            }
            else if (f.Status == FriendshipStatus.Pending)
            {
                if (f.ActionUserId == request.UserId)
                {
                    item.Status = "pending_sent";
                    response.PendingRequestsSent.Add(item);
                }
                else
                {
                    item.Status = "pending_received";
                    response.PendingRequestsReceived.Add(item);
                }
            }
        }

        return Result<FriendsResponseDto>.Success(response, "Lấy danh sách bạn bè thành công.");
    }
}
