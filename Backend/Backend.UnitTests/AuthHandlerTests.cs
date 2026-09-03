using System.Security.Claims;
using Application.Common.Interfaces;
using Application.DTOs;
using Application.Features.Auth.Commands;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class AuthHandlerTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtTokenService _jwtTokenService = Substitute.For<IJwtTokenService>();
    private readonly ITokenCacheService _tokenCacheService = Substitute.For<ITokenCacheService>();
    private readonly IGoogleAuthService _googleAuthService = Substitute.For<IGoogleAuthService>();

    private LoginCommandHandler CreateLoginHandler()
    {
        return new LoginCommandHandler(
            _unitOfWork,
            _passwordHasher,
            _jwtTokenService,
            _tokenCacheService);
    }

    // --- LoginCommandHandler Tests ---

    [Fact]
    public async Task Login_WhenUserNotFound_ShouldReturnFailure()
    {
        _unitOfWork.Users.GetByEmailAsync("nonexistent@example.com", Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var handler = CreateLoginHandler();

        var result = await handler.Handle(new LoginCommand("nonexistent@example.com", "Password123!"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Be("Email hoặc mật khẩu không chính xác.");
    }

    [Fact]
    public async Task Login_WhenPasswordIncorrect_ShouldReturnFailure()
    {
        var user = new User("user@example.com", "hashed_pass", UserRole.User);
        _unitOfWork.Users.GetByEmailAsync("user@example.com", Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHasher.VerifyPassword("WrongPass!", "hashed_pass")
            .Returns(false);

        var handler = CreateLoginHandler();

        var result = await handler.Handle(new LoginCommand("user@example.com", "WrongPass!"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Be("Email hoặc mật khẩu không chính xác.");
    }

    [Fact]
    public async Task Login_WhenUserBanned_ShouldReturnForbidden()
    {
        var user = new User("banned@example.com", "hashed_pass", UserRole.User);
        user.SetStatus(UserStatus.Banned);
        _unitOfWork.Users.GetByEmailAsync("banned@example.com", Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHasher.VerifyPassword("Pass123!", "hashed_pass")
            .Returns(true);

        var handler = CreateLoginHandler();

        var result = await handler.Handle(new LoginCommand("banned@example.com", "Pass123!"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
        result.Message.Should().Be("Tài khoản của bạn đã bị khóa.");
    }

    [Fact]
    public async Task Login_WhenCredentialsValid_ShouldReturnAuthTokens()
    {
        var user = new User("admin@example.com", "hashed_pass", UserRole.SystemAdmin);
        _unitOfWork.Users.GetByEmailAsync("admin@example.com", Arg.Any<CancellationToken>())
            .Returns(user);
        _passwordHasher.VerifyPassword("CorrectPass123!", "hashed_pass")
            .Returns(true);
        _jwtTokenService.GenerateAccessToken(user, Arg.Any<string>())
            .Returns("fake_jwt_access_token");
        _jwtTokenService.GenerateRefreshToken()
            .Returns("fake_refresh_token");

        var handler = CreateLoginHandler();

        var result = await handler.Handle(new LoginCommand("admin@example.com", "CorrectPass123!"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("fake_jwt_access_token");
        result.Data.RefreshToken.Should().Be("fake_refresh_token");
        result.Data.User.Email.Should().Be("admin@example.com");
        result.Data.User.Role.Should().Be(UserRole.SystemAdmin);
    }

    // --- RegisterCommandHandler Tests ---

    [Fact]
    public async Task Register_WhenEmailAlreadyUsed_ShouldReturnFailure()
    {
        _unitOfWork.Users.IsEmailUniqueAsync("existing@example.com", Arg.Any<CancellationToken>())
            .Returns(false);

        var handler = new RegisterCommandHandler(_unitOfWork, _passwordHasher);
        var result = await handler.Handle(new RegisterCommand("Nguyễn Văn A", "existing@example.com", "Password123!"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Be("Email này đã được sử dụng.");
        await _unitOfWork.Users.DidNotReceive().AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Register_WhenEmailIsUnique_ShouldCreateUserAndReturnSuccess()
    {
        _unitOfWork.Users.IsEmailUniqueAsync("new@example.com", Arg.Any<CancellationToken>())
            .Returns(true);
        _passwordHasher.HashPassword("Password123!")
            .Returns("secure_hash");
        _unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(1);

        var handler = new RegisterCommandHandler(_unitOfWork, _passwordHasher);
        var result = await handler.Handle(new RegisterCommand("Nguyễn Văn A", "new@example.com", "Password123!"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Message.Should().Be("Đăng ký tài khoản thành công.");
        await _unitOfWork.Users.Received(1).AddAsync(Arg.Is<User>(u => u.Email == "new@example.com" && u.PasswordHash == "secure_hash"), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // --- LogoutCommandHandler Tests ---

    [Fact]
    public async Task Logout_WhenTokensProvided_ShouldBlacklistJtiAndRemoveRefreshToken()
    {
        _jwtTokenService.GetUserIdFromToken("sample_access_token").Returns(42L);
        _jwtTokenService.GetJtiFromToken("sample_access_token").Returns("sample_jti");

        var handler = new LogoutCommandHandler(_jwtTokenService, _tokenCacheService);
        var result = await handler.Handle(new LogoutCommand("sample_access_token", "sample_refresh_token"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
        await _tokenCacheService.Received(1).RemoveRefreshTokenAsync(42L, Arg.Any<CancellationToken>());
        await _tokenCacheService.Received(1).BlacklistAccessTokenAsync("sample_jti", TimeSpan.FromDays(1), Arg.Any<CancellationToken>());
    }

    // --- RefreshTokenCommandHandler Tests ---

    [Fact]
    public async Task RefreshToken_WhenTokensEmpty_ShouldReturnUnauthorized()
    {
        var handler = new RefreshTokenCommandHandler(_unitOfWork, _jwtTokenService, _tokenCacheService);
        var result = await handler.Handle(new RefreshTokenCommand("", ""), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RefreshToken_WhenTokenMismatchInCache_ShouldReturnUnauthorized()
    {
        _jwtTokenService.GetPrincipalFromExpiredToken("token").Returns(new ClaimsPrincipal());
        _jwtTokenService.GetUserIdFromToken("token").Returns(10L);
        _tokenCacheService.GetRefreshTokenAsync(10L, Arg.Any<CancellationToken>()).Returns("cached_token_different");

        var handler = new RefreshTokenCommandHandler(_unitOfWork, _jwtTokenService, _tokenCacheService);
        var result = await handler.Handle(new RefreshTokenCommand("token", "client_token"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RefreshToken_WhenValid_ShouldGenerateNewTokensAndSaveToCache()
    {
        var user = new User("user@example.com", "hash", UserRole.User);
        _jwtTokenService.GetPrincipalFromExpiredToken("old_access").Returns(new ClaimsPrincipal());
        _jwtTokenService.GetUserIdFromToken("old_access").Returns(10L);
        _tokenCacheService.GetRefreshTokenAsync(10L, Arg.Any<CancellationToken>()).Returns("valid_refresh");
        _unitOfWork.Users.GetByIdWithProfileAsync(10L, Arg.Any<CancellationToken>()).Returns(user);
        _jwtTokenService.GenerateAccessToken(user).Returns("new_access");
        _jwtTokenService.GenerateRefreshToken().Returns("new_refresh");

        var handler = new RefreshTokenCommandHandler(_unitOfWork, _jwtTokenService, _tokenCacheService);
        var result = await handler.Handle(new RefreshTokenCommand("old_access", "valid_refresh"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("new_access");
        result.Data.RefreshToken.Should().Be("new_refresh");
        await _tokenCacheService.Received(1).SetRefreshTokenAsync(user.Id, "new_refresh", TimeSpan.FromDays(7), Arg.Any<CancellationToken>());
    }

    // --- GoogleLoginCommandHandler Tests ---

    [Fact]
    public async Task GoogleLogin_WhenTokenInvalid_ShouldReturnFailure()
    {
        _googleAuthService.ValidateIdTokenAsync("bad_id_token", Arg.Any<CancellationToken>())
            .Returns((GoogleUserInfo?)null);

        var handler = new GoogleLoginCommandHandler(_unitOfWork, _googleAuthService, _jwtTokenService, _tokenCacheService);
        var result = await handler.Handle(new GoogleLoginCommand("bad_id_token"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Be("Google Token không hợp lệ.");
    }

    [Fact]
    public async Task GoogleLogin_WhenExistingUser_ShouldReturnTokens()
    {
        var googleUser = new GoogleUserInfo { GoogleId = "gid_123", Email = "guser@example.com", FullName = "Google User" };
        var existingUser = new User("guser@example.com", "hash", UserRole.User);

        _googleAuthService.ValidateIdTokenAsync("valid_token", Arg.Any<CancellationToken>()).Returns(googleUser);
        _unitOfWork.Users.GetByGoogleIdAsync("gid_123", Arg.Any<CancellationToken>()).Returns(existingUser);
        _jwtTokenService.GenerateAccessToken(existingUser).Returns("g_access");
        _jwtTokenService.GenerateRefreshToken().Returns("g_refresh");

        var handler = new GoogleLoginCommandHandler(_unitOfWork, _googleAuthService, _jwtTokenService, _tokenCacheService);
        var result = await handler.Handle(new GoogleLoginCommand("valid_token"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("g_access");
        result.Data.RefreshToken.Should().Be("g_refresh");
    }
}
