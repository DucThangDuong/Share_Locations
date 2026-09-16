using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using MediatR;

namespace Application.Features.Geography.Queries;

public record GetProvinceLandingQuery(string IdOrSlug) : IRequest<Result<ProvinceLandingDto>>;

public class GetProvinceLandingQueryHandler : IRequestHandler<GetProvinceLandingQuery, Result<ProvinceLandingDto>>
{
    private readonly IProvinceRepository _provinceRepository;
    private readonly ICacheService _cacheService;

    public GetProvinceLandingQueryHandler(IProvinceRepository provinceRepository, ICacheService cacheService)
    {
        _provinceRepository = provinceRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<ProvinceLandingDto>> Handle(GetProvinceLandingQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.IdOrSlug))
        {
            return Result<ProvinceLandingDto>.NotFound("Mã hoặc tên tỉnh thành không hợp lệ.");
        }

        var normalizedKey = request.IdOrSlug.Trim().ToLowerInvariant();
        var cacheKey = $"geography:provinces:landing:v6:{normalizedKey}";

        var cached = await _cacheService.GetAsync<ProvinceLandingDto>(cacheKey, ct);
        if (cached != null)
        {
            return Result<ProvinceLandingDto>.Success(cached, "Lấy dữ liệu tỉnh thành thành công");
        }

        var landingData = await _provinceRepository.GetProvinceLandingAsync(request.IdOrSlug, ct);
        if (landingData == null)
        {
            return Result<ProvinceLandingDto>.NotFound($"Không tìm thấy dữ liệu cho tỉnh thành '{request.IdOrSlug}'.");
        }

        await _cacheService.SetAsync(cacheKey, landingData, TimeSpan.FromMinutes(30), ct);

        return Result<ProvinceLandingDto>.Success(landingData, "Lấy dữ liệu tỉnh thành thành công");
    }
}