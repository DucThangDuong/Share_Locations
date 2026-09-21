using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Blogs;

public record CreateAdminBlogCommand(CreateAdminBlogInput Input, long AuthorId) : IRequest<Result<long>>;

public class CreateAdminBlogCommandHandler : IRequestHandler<CreateAdminBlogCommand, Result<long>>
{
    private readonly IAdminBlogRepository _blogRepository;

    public CreateAdminBlogCommandHandler(IAdminBlogRepository blogRepository)
    {
        _blogRepository = blogRepository;
    }

    public async Task<Result<long>> Handle(CreateAdminBlogCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Title))
        {
            return Result<long>.Failure("Tiêu đề bài viết không được để trống.");
        }

        var id = await _blogRepository.CreateAdminBlogAsync(request.Input, request.AuthorId, ct);
        return Result<long>.Created(id, "Tạo mới bài viết cẩm nang thành công.");
    }
}
