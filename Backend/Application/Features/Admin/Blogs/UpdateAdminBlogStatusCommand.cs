using Application.Common;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Blogs;

public record UpdateAdminBlogStatusCommand(long Id, string Status) : IRequest<Result<bool>>;

public class UpdateAdminBlogStatusCommandHandler : IRequestHandler<UpdateAdminBlogStatusCommand, Result<bool>>
{
    private readonly IAdminBlogRepository _blogRepository;

    public UpdateAdminBlogStatusCommandHandler(IAdminBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<bool>> Handle(UpdateAdminBlogStatusCommand request, CancellationToken ct)
    {
        var success = await _blogRepository.UpdateAdminBlogStatusAsync(request.Id, request.Status, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy bài viết yêu cầu.");
        }

        return Result<bool>.Success(true, "Cập nhật trạng thái bài viết thành công.");
    }
}
