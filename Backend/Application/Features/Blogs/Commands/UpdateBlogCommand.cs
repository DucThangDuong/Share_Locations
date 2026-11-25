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

        if (blog.Status == BlogStatus.Published)
        {
            return Result.Failure("Bài viết đã được xuất bản nên không thể chỉnh sửa.");
        }

        if (blog.Status == BlogStatus.Pending)
        {
            return Result.Failure("Bài viết đang chờ duyệt nên tạm thời không thể chỉnh sửa.");
        }

        if (blog.Status == BlogStatus.Hidden)
        {
            return Result.Failure("Bài viết đang bị tạm ẩn nên không thể chỉnh sửa.");
        }

        var dto = request.Dto;
        var status = dto.Status == (int)BlogStatus.Draft
            ? BlogStatus.Draft
            : BlogStatus.Pending;

        var effectiveTitle = string.IsNullOrWhiteSpace(dto.Title)
            ? "Bản nháp chưa đặt tên"
            : dto.Title.Trim();

        if (status != BlogStatus.Draft)
        {
            var validationError = BlogContentValidator.ValidateSubmission(
                dto.Title,
                dto.Excerpt,
                dto.CoverImageUrl,
                dto.ContentJSON,
                dto.CategoryId);

            if (validationError != null)
            {
                return Result.Failure(validationError);
            }
        }

        blog.Update(
            effectiveTitle,
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
