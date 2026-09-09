using API.DTOs;
using API.Extensions;
using Application.DTOs;
using Application.Features.Reviews.Queries;
using FastEndpoints;
using MediatR;

namespace API.Endpoints.Reviews;

public class GetReviewCommentsRequest
{
    [BindFrom("id")]
    public long ReviewId { get; set; }
}

public class GetReviewCommentsEndpoint : Endpoint<GetReviewCommentsRequest, ApiSuccessResponse<ReviewCommentsDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/v1/reviews/{id}/comments", "/api/reviews/{id}/comments");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách bình luận của bài đánh giá";
            s.Description = "Trả về tổng số lượng bình luận và cây bình luận lồng nhau (kèm các phản hồi) của bài review.";
        });
    }

    public override async Task HandleAsync(GetReviewCommentsRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetReviewCommentsQuery(req.ReviewId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
