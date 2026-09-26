using Application.Common;
using Application.Common.Interfaces;
using Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Auth.Commands;

public record ResetPasswordCommand(string ResetToken, string NewPassword) : IRequest<Result<bool>>;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICacheService _cacheService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<ResetPasswordCommandHandler> _logger;

    public ResetPasswordCommandHandler(
        IUnitOfWork unitOfWork,
        ICacheService cacheService,
        IPasswordHasher passwordHasher,
        ILogger<ResetPasswordCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _cacheService = cacheService;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        // 1. Kiểm tra ResetToken trong Redis
        var resetTokenKey = $"forgot_password:reset_token:{request.ResetToken.Trim()}";
        var userEmail = await _cacheService.GetAsync<string>(resetTokenKey, ct);

        if (string.IsNullOrEmpty(userEmail))
        {
            return Result<bool>.Failure("Phiên đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng thực hiện lại từ đầu.");
        }

        // 2. Tìm người dùng theo email đã lưu trong token
        var user = await _unitOfWork.Users.GetByEmailAsync(userEmail, ct);
        if (user == null)
        {
            return Result<bool>.Failure("Không tìm thấy thông tin tài khoản người dùng.");
        }

        // 3. Hash mật khẩu mới và lưu vào cơ sở dữ liệu
        var newHash = _passwordHasher.HashPassword(request.NewPassword);
        user.SetPasswordHash(newHash);

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync(ct);

        // 4. Xóa ResetToken khỏi Redis ngay lập tức (One-Time Token)
        await _cacheService.RemoveAsync(resetTokenKey, ct);

        _logger.LogInformation("🔒 Đã đặt lại mật khẩu thành công cho tài khoản {Email} qua ResetToken.", userEmail);

        return Result<bool>.Success(true, "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ với mật khẩu mới.");
    }
}
