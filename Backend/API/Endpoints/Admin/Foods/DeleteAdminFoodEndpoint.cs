using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Foods;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Foods;

public class DeleteAdminFoodRequest
{
    public long Id { get; set; }
}

public class DeleteAdminFoodEndpoint : Endpoint<DeleteAdminFoodRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/foods/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Xóa món ăn đặc sản (Admin)";
            s.Description = "Xóa món ăn đặc sản khỏi hệ thống danh mục.";
        });
    }

    public override async Task HandleAsync(DeleteAdminFoodRequest req, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteAdminFoodCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
