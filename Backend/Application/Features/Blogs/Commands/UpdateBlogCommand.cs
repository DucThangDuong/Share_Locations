using Application.Common;
using Application.DTOs;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Blogs.Commands;

public record UpdateBlogCommand(long Id, long UserId, UpdateBlogRequestDto Dto) : IRequest<Result>;

public class UpdateBlogCommandHandler : IRequestHandler<UpdateBlogCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateBlogCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(UpdateBlogCommand request, CancellationToken ct)
    {
        var blog = await _unitOfWork.Blogs.GetByIdAsync(request.Id, ct);
        if (blog == null)
        {
            return Result.NotFound("Không tìm thấy bài viết.");
        }

        if (blog.AuthorId != request.UserId)
        {
            return Result.Forbidden("Bạn không có quyền chỉnh sửa bài viết này.");
        }

        var dto = request.Dto;
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return Result.Failure("Tiêu đề bài viết không được để trống.");
        }

        var status = Enum.IsDefined(typeof(BlogStatus), (byte)dto.Status)
            ? (BlogStatus)dto.Status
            : blog.Status;

        blog.Update(
            dto.Title,
            dto.Excerpt,
            dto.ContentJSON,
            dto.CoverImageUrl,
            dto.CategoryId,
            dto.ReadTimeMinutes,
            status);

        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success("Cập nhật bài viết thành công.");
    }
}
