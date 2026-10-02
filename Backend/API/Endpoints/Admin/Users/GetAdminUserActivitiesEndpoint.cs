using API.DTOs;
using API.Extensions;
using Application.DTOs.Admin;
using Application.Features.Admin.Users;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Users;

public class GetAdminUserActivitiesRequest
{
    public long UserId { get; set; }
}

public class GetAdminUserActivitiesEndpoint : Endpoint<GetAdminUserActivitiesRequest, ApiSuccessResponse<UserActivitiesDto>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Get("/api/admin/users/{userId}/activities");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy hoạt động đóng góp công khai của người dùng (Đánh giá, Bài viết, Chuyến đi, Đề xuất)";
            s.Description = "Phục vụ hiển thị 4 Tabs hoạt động đóng góp công khai trong trang chi tiết người dùng thường. Chỉ lấy bài viết đã xuất bản (Published), chuyến đi công khai (Public), đánh giá hoạt động (Active) và đề xuất đã duyệt (Approved), không lấy bản nháp hay nội dung riêng tư.";
        });
    }

    public override async Task HandleAsync(GetAdminUserActivitiesRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetUserActivitiesQuery(req.UserId), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
