using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Proposals.Queries;

public record GetMyProposalDetailQuery(long Id, long CurrentUserId) : IRequest<Result<UserProposalItemDto>>;

public class GetMyProposalDetailQueryHandler : IRequestHandler<GetMyProposalDetailQuery, Result<UserProposalItemDto>>
{
    private readonly IUserPersonalizationRepository _repo;

    public GetMyProposalDetailQueryHandler(IUserPersonalizationRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<UserProposalItemDto>> Handle(GetMyProposalDetailQuery request, CancellationToken ct)
    {
        if (request.Id <= 0)
        {
            return Result<UserProposalItemDto>.NotFound("Không tìm thấy đề xuất địa điểm.");
        }

        var record = await _repo.GetProposalByIdAsync(request.Id, ct);
        if (!record.HasValue)
        {
            return Result<UserProposalItemDto>.NotFound("Không tìm thấy đề xuất địa điểm.");
        }

        if (record.Value.OwnerUserId != request.CurrentUserId)
        {
            return Result<UserProposalItemDto>.Forbidden("Bạn không có quyền xem đề xuất địa điểm này.");
        }

        return Result<UserProposalItemDto>.Success(record.Value.Proposal, "Lấy chi tiết đề xuất thành công.");
    }
}
