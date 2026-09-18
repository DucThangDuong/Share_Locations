using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Chat.Queries;

public record GetInboxQuery(long UserId) : IRequest<Result<IReadOnlyList<InboxItemDto>>>;

public class GetInboxQueryHandler : IRequestHandler<GetInboxQuery, Result<IReadOnlyList<InboxItemDto>>>
{
    private readonly IChatRepository _chatRepository;

    public GetInboxQueryHandler(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    public async Task<Result<IReadOnlyList<InboxItemDto>>> Handle(GetInboxQuery request, CancellationToken ct)
    {
        var inbox = await _chatRepository.GetInboxAsync(request.UserId, ct);
        return Result<IReadOnlyList<InboxItemDto>>.Success(inbox);
    }
}
