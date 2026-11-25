using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Admin.Catalog.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Catalog;

public class DeleteAdminCollectionRequest
{
    public int Id { get; set; }
}

public class DeleteAdminCollectionEndpoint : Endpoint<DeleteAdminCollectionRequest, ApiSuccessResponse<bool>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Delete("/api/admin/collections/{id}");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("CategoryAdmin", "SystemAdmin");
        Options(x => x.RequireRateLimiting("write_api"));
        Summary(s =>
        {
            s.Summary = "Xóa bộ sưu tập (Admin)";
            s.Description = "Xóa vĩnh viễn một bộ sưu tập và danh sách liên kết địa điểm của bộ sưu tập đó.";
        });
    }

    public override async Task HandleAsync(DeleteAdminCollectionRequest req, CancellationToken ct)
    {
        if (req.Id <= 0)
        {
            await this.SendApiResponseAsync(
                Result<bool>.Failure("Mã bộ sưu tập (Id) không hợp lệ."),
                ct);
            return;
        }

        var result = await Mediator.Send(new DeleteAdminCollectionCommand(req.Id), ct);
        await this.SendApiResponseAsync(result, ct);
    }
}
