using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Blogs.Commands;

public record CreateBlogCommand(long UserId, CreateBlogRequestDto Dto) : IRequest<Result<UserBlogItemDto>>;

public class CreateBlogCommandHandler : IRequestHandler<CreateBlogCommand, Result<UserBlogItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateBlogCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UserBlogItemDto>> Handle(CreateBlogCommand request, CancellationToken ct)
    {
        var dto = request.Dto;
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return Result<UserBlogItemDto>.Failure("Tiêu đề bài viết không được để trống.");
        }

        var status = Enum.IsDefined(typeof(BlogStatus), (byte)dto.Status)
            ? (BlogStatus)dto.Status
            : BlogStatus.Published;

        var blog = new Blog(
            request.UserId,
            dto.Title,
            dto.Excerpt,
            dto.ContentJSON,
            dto.CoverImageUrl,
            dto.CategoryId,
            dto.ReadTimeMinutes,
            status);

        await _unitOfWork.Blogs.AddAsync(blog, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var responseDto = new UserBlogItemDto
        {
            Id = blog.Id,
            Title = blog.Title,
            Excerpt = blog.Excerpt,
            CoverImageUrl = blog.CoverImageUrl,
            ContentJSON = blog.ContentJSON,
            CategoryId = blog.CategoryId,
            ReadTimeMinutes = blog.ReadTimeMinutes,
            ViewCount = blog.ViewCount,
            Status = (int)blog.Status,
            CreatedAt = blog.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            UpdatedAt = blog.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        return Result<UserBlogItemDto>.Created(responseDto, "Tạo bài viết blog thành công.");
    }
}
