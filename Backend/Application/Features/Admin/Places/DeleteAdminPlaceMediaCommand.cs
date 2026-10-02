using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Admin.Places;

public record DeleteAdminPlaceMediaCommand(long PlaceId, long MediaId) : IRequest<Result<bool>>;

public class DeleteAdminPlaceMediaCommandHandler : IRequestHandler<DeleteAdminPlaceMediaCommand, Result<bool>>
{
    private readonly IAdminPlaceRepository _placeRepository;
    private readonly IBlobService _blobService;

    public DeleteAdminPlaceMediaCommandHandler(
        IAdminPlaceRepository placeRepository,
        IBlobService blobService)
    {
        _placeRepository = placeRepository;
        _blobService = blobService;
    }

    public async Task<Result<bool>> Handle(DeleteAdminPlaceMediaCommand request, CancellationToken ct)
    {
        var (success, mediaUrl) = await _placeRepository.DeletePlaceMediaAsync(request.PlaceId, request.MediaId, ct);
        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy hình ảnh hoặc bạn không có quyền xóa ảnh của địa điểm này.");
        }

        if (!string.IsNullOrWhiteSpace(mediaUrl) && mediaUrl.Contains(".blob.core.windows.net/"))
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _blobService.DeleteImageAsync(mediaUrl, "places", CancellationToken.None);
                }
                catch
                {
                    // Ignore background cleanup failure
                }
            }, CancellationToken.None);
        }

        return Result<bool>.Success(true, "Xóa hình ảnh khỏi bộ sưu tập thành công.");
    }
}
