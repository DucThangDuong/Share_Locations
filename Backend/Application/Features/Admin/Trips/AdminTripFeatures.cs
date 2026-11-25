using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs.Admin;
using MediatR;

namespace Application.Features.Admin.Trips;

public record GetAdminTripsQuery(
    int? ProvinceId,
    byte? Privacy,
    byte? Status,
    string? Keyword,
    int Page = 1,
    int PageSize = 15,
    string? SortBy = null,
    string? SortOrder = null) : IRequest<Result<PagedResult<AdminTripListItemDto>>>;

public class GetAdminTripsQueryHandler : IRequestHandler<GetAdminTripsQuery, Result<PagedResult<AdminTripListItemDto>>>
{
    private readonly IAdminTripRepository _tripRepository;

    public GetAdminTripsQueryHandler(IAdminTripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<PagedResult<AdminTripListItemDto>>> Handle(GetAdminTripsQuery request, CancellationToken ct)
    {
        var page = request.Page > 0 ? request.Page : 1;
        var pageSize = request.PageSize > 0 ? request.PageSize : 15;

        var result = await _tripRepository.GetAdminTripsAsync(
            request.ProvinceId,
            request.Privacy,
            request.Status,
            request.Keyword,
            page,
            pageSize,
            request.SortBy,
            request.SortOrder,
            ct);

        return Result<PagedResult<AdminTripListItemDto>>.Success(result);
    }
}

public record GetAdminTripDetailQuery(long Id) : IRequest<Result<AdminTripDetailDto>>;

public class GetAdminTripDetailQueryHandler : IRequestHandler<GetAdminTripDetailQuery, Result<AdminTripDetailDto>>
{
    private readonly IAdminTripRepository _tripRepository;

    public GetAdminTripDetailQueryHandler(IAdminTripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<AdminTripDetailDto>> Handle(GetAdminTripDetailQuery request, CancellationToken ct)
    {
        AdminTripDetailDto? trip;
        try
        {
            trip = await _tripRepository.GetAdminTripDetailAsync(request.Id, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Result<AdminTripDetailDto>.Forbidden(ex.Message);
        }

        if (trip == null)
        {
            return Result<AdminTripDetailDto>.NotFound("Không tìm thấy lịch trình chuyến đi yêu cầu.");
        }

        return Result<AdminTripDetailDto>.Success(trip);
    }
}

public record CreateAdminTripCommand(CreateAdminTripInput Input) : IRequest<Result<long>>;

public class CreateAdminTripCommandHandler : IRequestHandler<CreateAdminTripCommand, Result<long>>
{
    private readonly IAdminTripRepository _tripRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICacheService? _cacheService;

    public CreateAdminTripCommandHandler(
        IAdminTripRepository tripRepository,
        ICurrentUserService currentUserService,
        ICacheService? cacheService = null)
    {
        _tripRepository = tripRepository;
        _currentUserService = currentUserService;
        _cacheService = cacheService;
    }

    public async Task<Result<long>> Handle(CreateAdminTripCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Title))
        {
            return Result<long>.Failure("Tiêu đề lịch trình chuyến đi không được để trống.");
        }

        if (request.Input.StartDate.HasValue && request.Input.EndDate.HasValue && request.Input.StartDate > request.Input.EndDate)
        {
            return Result<long>.Failure("Ngày bắt đầu không được sau ngày kết thúc.");
        }

        var authorId = _currentUserService.UserId;
        if (!authorId.HasValue)
        {
            return Result<long>.Unauthorized("Không thể xác định thông tin quản trị viên tạo lịch trình.");
        }

        long id;
        try
        {
            id = await _tripRepository.CreateAdminTripAsync(request.Input, authorId.Value, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Result<long>.Forbidden(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Result<long>.Failure(ex.Message);
        }

        if (_cacheService != null)
        {
            await _cacheService.RemoveByPatternAsync("itineraries:*", ct);
        }

        return Result<long>.Created(id, "Tạo mới lịch trình chuyến đi thành công.");
    }
}

public record UpdateAdminTripCommand(long Id, UpdateAdminTripInput Input) : IRequest<Result<bool>>;

public class UpdateAdminTripCommandHandler : IRequestHandler<UpdateAdminTripCommand, Result<bool>>
{
    private readonly IAdminTripRepository _tripRepository;
    private readonly ICacheService? _cacheService;

    public UpdateAdminTripCommandHandler(
        IAdminTripRepository tripRepository,
        ICacheService? cacheService = null)
    {
        _tripRepository = tripRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminTripCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Input.Title))
        {
            return Result<bool>.Failure("Tiêu đề lịch trình chuyến đi không được để trống.");
        }

        if (request.Input.StartDate.HasValue && request.Input.EndDate.HasValue && request.Input.StartDate > request.Input.EndDate)
        {
            return Result<bool>.Failure("Ngày bắt đầu không được sau ngày kết thúc.");
        }

        bool success;
        try
        {
            success = await _tripRepository.UpdateAdminTripAsync(request.Id, request.Input, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Result<bool>.Forbidden(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Result<bool>.Failure(ex.Message);
        }

        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy lịch trình chuyến đi yêu cầu cập nhật.");
        }

        if (_cacheService != null)
        {
            await _cacheService.RemoveByPatternAsync("itineraries:*", ct);
        }

        return Result<bool>.Success(true, "Cập nhật lịch trình chuyến đi thành công.");
    }
}

public record UpdateAdminTripPrivacyCommand(long Id, byte Privacy, string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminTripPrivacyCommandHandler : IRequestHandler<UpdateAdminTripPrivacyCommand, Result<bool>>
{
    private readonly IAdminTripRepository _tripRepository;
    private readonly ICacheService? _cacheService;

    public UpdateAdminTripPrivacyCommandHandler(
        IAdminTripRepository tripRepository,
        ICacheService? cacheService = null)
    {
        _tripRepository = tripRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminTripPrivacyCommand request, CancellationToken ct)
    {
        if (request.Privacy > 2)
        {
            return Result<bool>.Failure("Chế độ riêng tư không hợp lệ (chỉ chấp nhận 0, 1 hoặc 2).");
        }

        bool success;
        try
        {
            success = await _tripRepository.UpdateAdminTripPrivacyAsync(request.Id, request.Privacy, request.Reason, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Result<bool>.Forbidden(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Result<bool>.Failure(ex.Message);
        }

        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy lịch trình chuyến đi yêu cầu.");
        }

        if (_cacheService != null)
        {
            await _cacheService.RemoveByPatternAsync("itineraries:*", ct);
        }

        return Result<bool>.Success(true, "Cập nhật chế độ riêng tư lịch trình thành công.");
    }
}

public record UpdateAdminTripStatusCommand(long Id, byte Status, string? Reason) : IRequest<Result<bool>>;

public class UpdateAdminTripStatusCommandHandler : IRequestHandler<UpdateAdminTripStatusCommand, Result<bool>>
{
    private readonly IAdminTripRepository _tripRepository;
    private readonly ICacheService? _cacheService;

    public UpdateAdminTripStatusCommandHandler(
        IAdminTripRepository tripRepository,
        ICacheService? cacheService = null)
    {
        _tripRepository = tripRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(UpdateAdminTripStatusCommand request, CancellationToken ct)
    {
        if (request.Status > 2)
        {
            return Result<bool>.Failure("Trạng thái lịch trình không hợp lệ (chỉ chấp nhận 0, 1 hoặc 2).");
        }

        bool success;
        try
        {
            success = await _tripRepository.UpdateAdminTripStatusAsync(request.Id, request.Status, request.Reason, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Result<bool>.Forbidden(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Result<bool>.Failure(ex.Message);
        }

        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy lịch trình chuyến đi yêu cầu.");
        }

        if (_cacheService != null)
        {
            await _cacheService.RemoveByPatternAsync("itineraries:*", ct);
        }

        return Result<bool>.Success(true, "Cập nhật trạng thái lịch trình thành công.");
    }
}

public record DeleteAdminTripCommand(long Id) : IRequest<Result<bool>>;

public class DeleteAdminTripCommandHandler : IRequestHandler<DeleteAdminTripCommand, Result<bool>>
{
    private readonly IAdminTripRepository _tripRepository;
    private readonly ICacheService? _cacheService;

    public DeleteAdminTripCommandHandler(
        IAdminTripRepository tripRepository,
        ICacheService? cacheService = null)
    {
        _tripRepository = tripRepository;
        _cacheService = cacheService;
    }

    public async Task<Result<bool>> Handle(DeleteAdminTripCommand request, CancellationToken ct)
    {
        bool success;
        try
        {
            success = await _tripRepository.DeleteAdminTripAsync(request.Id, ct);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Result<bool>.Forbidden(ex.Message);
        }

        if (!success)
        {
            return Result<bool>.NotFound("Không tìm thấy lịch trình chuyến đi yêu cầu xóa.");
        }

        if (_cacheService != null)
        {
            await _cacheService.RemoveByPatternAsync("itineraries:*", ct);
        }

        return Result<bool>.Success(true, "Xóa lịch trình chuyến đi thành công.");
    }
}
