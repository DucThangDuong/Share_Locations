﻿using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Features.Chat.Commands;
using FastEndpoints;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Chat;

public class CreateGroupRoomRequest
{
    public string Name { get; set; } = string.Empty;
    public List<long> MemberIds { get; set; } = new();
}

public class CreateGroupRoomEndpoint : Endpoint<CreateGroupRoomRequest, ApiSuccessResponse<object>>
{
    public IMediator Mediator { get; set; } = null!;

    public override void Configure()
    {
        Post("/api/chat/group", "/api/chat/rooms");
        Tags("Chat");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("User", "CategoryAdmin", "SystemAdmin");
        Summary(s =>
        {
            s.Summary = "Tạo phòng chat nhóm";
            s.Description = "Tạo phòng trò chuyện nhóm mới với tên nhóm và danh sách thành viên bạn bè.";
        });
    }

    public override async Task HandleAsync(CreateGroupRoomRequest req, CancellationToken ct)
    {
        var userId = this.GetUserId();
        if (!userId.HasValue)
        {
            await this.SendApiResponseAsync(Result.Unauthorized("Bạn cần đăng nhập để tạo nhóm chat."), ct);
            return;
        }

        var result = await Mediator.Send(new CreateGroupRoomCommand(userId.Value, req.Name, req.MemberIds), ct);
        if (result.IsSuccess)
        {
            await this.SendApiResponseAsync(Result<object>.Success(new { roomId = result.Data }, "Tạo nhóm trò chuyện thành công."), ct);
        }
        else
        {
            await this.SendApiResponseAsync(result, ct);
        }
    }
}