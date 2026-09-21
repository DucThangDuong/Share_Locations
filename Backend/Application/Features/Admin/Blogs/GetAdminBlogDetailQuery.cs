using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Blogs;

public record GetAdminBlogDetailQuery(long Id) : IRequest<Result<AdminBlogDetailDto>>;

public class GetAdminBlogDetailQueryHandler : IRequestHandler<GetAdminBlogDetailQuery, Result<AdminBlogDetailDto>>
{
    private readonly IAdminBlogRepository _blogRepository;

    public GetAdminBlogDetailQueryHandler(IAdminBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<AdminBlogDetailDto>> Handle(GetAdminBlogDetailQuery request, CancellationToken ct)
    {
        var blog = await _blogRepository.GetAdminBlogDetailAsync(request.Id, ct);
        if (blog == null)
        {
            return Result<AdminBlogDetailDto>.NotFound("Không tìm thấy bài viết cẩm nang yêu cầu.");
        }

        return Result<AdminBlogDetailDto>.Success(blog);
    }
}
