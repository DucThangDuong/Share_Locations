using API.DTOs;
using API.Extensions;
using Application.Common;
using Application.Common.Interfaces;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace API.Endpoints.Admin.Settings;

public class GetModerationKeywordsRequest
{
    public string Category { get; set; } = "profanity"; // "profanity" hoặc "spam"
}

public class ManageModerationKeywordRequest
{
    public string Category { get; set; } = "profanity";
    public string Keyword { get; set; } = string.Empty;
}

public class GetModerationKeywordsEndpoint : Endpoint<GetModerationKeywordsRequest>
{
    private readonly IModerationKeywordStore _keywordStore;

    public GetModerationKeywordsEndpoint(IModerationKeywordStore keywordStore)
    {
        _keywordStore = keywordStore;
    }

    public override void Configure()
    {
        Get("/api/admin/moderation/keywords");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin", "CategoryAdmin");
        Summary(s =>
        {
            s.Summary = "Lấy danh sách từ cấm / spam từ Redis Cache";
        });
    }

    public override async Task HandleAsync(GetModerationKeywordsRequest req, CancellationToken ct)
    {
        var keywords = await _keywordStore.GetKeywordsAsync(req.Category, ct);
        await this.SendApiResponseAsync(Result<IReadOnlyList<string>>.Success(keywords, "Lấy danh sách từ khóa thành công"), ct);
    }
}

public class AddModerationKeywordEndpoint : Endpoint<ManageModerationKeywordRequest>
{
    private readonly IModerationKeywordStore _keywordStore;

    public AddModerationKeywordEndpoint(IModerationKeywordStore keywordStore)
    {
        _keywordStore = keywordStore;
    }

    public override void Configure()
    {
        Post("/api/admin/moderation/keywords");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin", "CategoryAdmin");
        Summary(s =>
        {
            s.Summary = "Thêm từ cấm / spam mới vào Redis Cache";
        });
    }

    public override async Task HandleAsync(ManageModerationKeywordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Keyword))
        {
            await this.SendApiResponseAsync(Result<bool>.Failure("Từ khóa không được để trống."), ct);
            return;
        }

        var added = await _keywordStore.AddKeywordAsync(req.Category, req.Keyword, ct);
        await this.SendApiResponseAsync(Result<bool>.Success(added, $"Đã thêm từ khóa '{req.Keyword}' vào danh mục {req.Category} trên Redis"), ct);
    }
}

public class DeleteModerationKeywordEndpoint : Endpoint<ManageModerationKeywordRequest>
{
    private readonly IModerationKeywordStore _keywordStore;

    public DeleteModerationKeywordEndpoint(IModerationKeywordStore keywordStore)
    {
        _keywordStore = keywordStore;
    }

    public override void Configure()
    {
        Delete("/api/admin/moderation/keywords");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("SystemAdmin", "CategoryAdmin");
        Summary(s =>
        {
            s.Summary = "Xóa từ cấm / spam khỏi Redis Cache";
        });
    }

    public override async Task HandleAsync(ManageModerationKeywordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Keyword))
        {
            await this.SendApiResponseAsync(Result<bool>.Failure("Từ khóa không được để trống."), ct);
            return;
        }

        var removed = await _keywordStore.RemoveKeywordAsync(req.Category, req.Keyword, ct);
        await this.SendApiResponseAsync(Result<bool>.Success(removed, $"Đã xóa từ khóa '{req.Keyword}' khỏi Redis"), ct);
    }
}
