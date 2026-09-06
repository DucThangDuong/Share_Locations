using Application.Common;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Places.Commands;

public record CreatePlaceReviewCommand(
    long PlaceId,
    long UserId,
    byte Rating,
    string? Content,
    DateOnly? VisitDate,
    List<string>? MediaUrls) : IRequest<Result<ReviewItemDto>>;

public class CreatePlaceReviewCommandHandler : IRequestHandler<CreatePlaceReviewCommand, Result<ReviewItemDto>>
{
    private readonly IPlaceRepository _placeRepository;

    public CreatePlaceReviewCommandHandler(IPlaceRepository placeRepository)
    {
        _placeRepository = placeRepository;
    }

    public async Task<Result<ReviewItemDto>> Handle(CreatePlaceReviewCommand request, CancellationToken ct)
    {
        if (request.Rating < 1 || request.Rating > 5)
        {
            return Result<ReviewItemDto>.Failure("Đánh giá sao phải nằm trong khoảng từ 1 đến 5 sao.");
        }

        var review = await _placeRepository.CreateReviewAsync(
            request.PlaceId,
            request.UserId,
            request.Rating,
            request.Content ?? string.Empty,
            request.MediaUrls,
            ct);

        return Result<ReviewItemDto>.Success(review, "Đánh giá của bạn đã được đăng thành công.");
    }
}
