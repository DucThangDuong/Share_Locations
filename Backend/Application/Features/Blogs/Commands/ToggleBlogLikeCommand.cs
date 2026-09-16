using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Blogs.Commands;

public record ToggleBlogLikeCommand(long BlogId, long UserId) : IRequest<Result<BlogLikeResponseDto>>;

public class ToggleBlogLikeCommandHandler : IRequestHandler<ToggleBlogLikeCommand, Result<BlogLikeResponseDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ToggleBlogLikeCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<BlogLikeResponseDto>> Handle(ToggleBlogLikeCommand request, CancellationToken ct)
    {
        var blog = await _unitOfWork.Blogs.GetByIdAsync(request.BlogId, ct);
        if (blog == null)
        {
            return Result<BlogLikeResponseDto>.NotFound("Bài viết không tồn tại.");
        }

        var existing = await _unitOfWork.Favorites.GetAsync(request.UserId, request.BlogId, FavoriteTargetType.Blog, ct);
        bool isLiked;

        if (existing != null)
        {
            _unitOfWork.Favorites.Remove(existing);
            isLiked = false;
        }
        else
        {
            var favorite = new Favorite(request.UserId, request.BlogId, FavoriteTargetType.Blog);
            await _unitOfWork.Favorites.AddAsync(favorite, ct);
            isLiked = true;
        }

        await _unitOfWork.SaveChangesAsync(ct);

        var totalLikes = await _unitOfWork.Favorites.CountAsync(request.BlogId, FavoriteTargetType.Blog, ct);

        var response = new BlogLikeResponseDto
        {
            IsLiked = isLiked,
            LikesCount = totalLikes
        };

        var message = isLiked ? "Đã thích bài viết." : "Đã bỏ thích bài viết.";
        return Result<BlogLikeResponseDto>.Success(response, message);
    }
}
