using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Blogs;

public record UpdateAdminBlogCommand(long Id, UpdateAdminBlogInput Input) : IRequest<Result<bool>>;

public class UpdateAdminBlogCommandHandler : IRequestHandler<UpdateAdminBlogCommand, Result<bool>>
{
    private readonly IAdminBlogRepository _blogRepository;

    public UpdateAdminBlogCommandHandler(IAdminBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<bool>> Handle(UpdateAdminBlogCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Title))
        {
            return Result<bool>.Failure("Tiêu đề bài viết không được để trống.");
        }

        var success = await _blogRepository.UpdateAdminBlogAsync(request.Id, request.Input, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy bài viết yêu cầu cập nhật.");
        }

        return Result<bool>.Success(true, "Cập nhật bài viết thành công.");
    }
}
