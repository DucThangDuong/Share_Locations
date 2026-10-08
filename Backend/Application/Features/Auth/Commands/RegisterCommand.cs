using Application.Common;
using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands;

public record RegisterCommand(string FullName, string Email, string Password) : IRequest<Result<long>>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly INotificationRepository _notificationRepository;

    public RegisterCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        INotificationRepository notificationRepository)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _notificationRepository = notificationRepository;
    }

    public async Task<Result<long>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var isUnique = await _unitOfWork.Users.IsEmailUniqueAsync(request.Email, ct);
        if (!isUnique)
        {
            return Result<long>.Failure("Email này đã được sử dụng.");
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var user = new User(request.Email, passwordHash, UserRoleType.User);
        var profile = new UserProfile(0, request.FullName);
        user.SetProfile(profile);

        await _unitOfWork.Users.AddAsync(user, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Gửi thông báo chào mừng thành viên mới gia nhập hệ thống
        try
        {
            await _notificationRepository.CreateNotificationAsync(new CreateNotificationInput
            {
                UserId = user.Id,
                Title = "Chào mừng bạn đến với LangThang!",
                Content = "Chào mừng bạn gia nhập cộng đồng LangThang! Hãy bắt đầu khám phá và chia sẻ những địa điểm thú vị ngay hôm nay.",
                Type = NotificationType.System,
                Priority = 2,
                TargetUrl = "/explore",
                GroupKey = $"WELCOME_{user.Id}"
            }, ct);
        }
        catch
        {
            // Non-blocking notification dispatch
        }

        return Result<long>.Success(user.Id, "Đăng ký tài khoản thành công.");
    }
}
