using Application.Common;
using Application.DTOs;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Reviews.Queries;

public record GetReviewCommentsQuery(long ReviewId, bool IncludeHidden = false) : IRequest<Result<ReviewCommentsDto>>;

public class GetReviewCommentsQueryHandler : IRequestHandler<GetReviewCommentsQuery, Result<ReviewCommentsDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetReviewCommentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ReviewCommentsDto>> Handle(GetReviewCommentsQuery request, CancellationToken ct)
    {
        var comments = await _unitOfWork.Comments.GetByReviewIdAsync(request.ReviewId, request.IncludeHidden, ct);

        var dtoList = comments.Select(c => new CommentDto
        {
            Id = c.Id,
            ReviewId = c.ReviewId,
            UserId = c.UserId.ToString(),
            UserName = c.User?.Profile?.FullName ?? "Người dùng LangThang",
            UserAvatar = c.User?.Profile?.AvatarUrl,
            Content = c.Content,
            ParentId = c.ParentId,
            CreatedAt = c.CreatedAt,
            Status = c.Status == Domain.Enums.CommentStatus.Active ? "active" : "hidden",
            Replies = new List<CommentDto>()
        }).ToList();

        var commentLookup = dtoList.ToDictionary(c => c.Id);
        var rootComments = new List<CommentDto>();

        foreach (var item in dtoList)
        {
            if (item.ParentId.HasValue && commentLookup.TryGetValue(item.ParentId.Value, out var parent))
            {
                parent.Replies.Add(item);
            }
            else
            {
                rootComments.Add(item);
            }
        }

        var resultDto = new ReviewCommentsDto
        {
            TotalComments = comments.Count,
            Items = rootComments
        };

        return Result<ReviewCommentsDto>.Success(resultDto);
    }
}
