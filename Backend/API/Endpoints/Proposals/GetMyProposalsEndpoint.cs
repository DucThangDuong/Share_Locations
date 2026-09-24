using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.DTOs;
using Application.Features.Users.Queries;
using FastEndpoints;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Proposals;

public class GetMyProposalsRequest
{
    [QueryParam]
    public int? Status { get; set; }

    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 12;
}

public class GetMyProposalsRequestValidator : Validator<GetMyProposalsRequest>
{
    public GetMyProposalsRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Số trang (page) phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Kích thước trang (pageSize) phải từ 1 đến 100.");
    }
}

public class GetMyProposalsEndpoint : Endpoint<GetMyProposalsRequest, ApiSuccessResponse<UserProposalPagedResultDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/proposals/my-proposals");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("general_api"));
        Summary(s =>
        {
            s.Summary = "Lấy danh sách đề xuất của tôi";
            s.Description = "Lấy danh sách các địa điểm do chính người dùng hiện tại đề xuất lên hệ thống, kèm đầy đủ thông tin chi tiết và trạng thái duyệt.";
        });
    }

    public override async Task HandleAsync(GetMyProposalsRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(
                Result<UserProposalPagedResultDto>.Unauthorized("Bạn cần đăng nhập để xem danh sách đề xuất."),
                ct);
            return;
        }

        var result = await Mediator.Send(
            new GetUserProposalsQuery(userId.Value, req.Status, req.Page, req.PageSize),
            ct);

        await this.SendApiResponseAsync(result, ct);
    }
}
