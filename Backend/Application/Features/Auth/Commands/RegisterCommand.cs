using Application.Common;
using Application.Common.Interfaces;
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

    public RegisterCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<long>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var isUnique = await _unitOfWork.Users.IsEmailUniqueAsync(request.Email, ct);
        if (!isUnique)
        {
            return Result<long>.Failure("Email này đã được sử dụng.");
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var user = new User(request.Email, passwordHash, UserRole.User);

        await _unitOfWork.Users.AddAsync(user, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Create UserProfile linked to the new User.Id
        var profile = new UserProfile(user.Id, request.FullName);
        await _unitOfWork.UserProfiles.AddAsync(profile, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<long>.Success(user.Id, "Đăng ký tài khoản thành công.");
    }
}
