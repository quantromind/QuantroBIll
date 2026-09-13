using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.DTOs;
using PetBharke.Application.Interfaces;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMongoDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public AuthController(
        IAuthService authService,
        ICurrentUserService currentUserService,
        IMongoDbContext context,
        IPasswordHasher passwordHasher)
    {
        _authService = authService;
        _currentUserService = currentUserService;
        _context = context;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        return Ok(new { success = true, data = response });
    }

    [HttpPost("pin-login")]
    [AllowAnonymous]
    public async Task<IActionResult> PinLogin([FromBody] PinLoginRequest request)
    {
        var response = await _authService.PinLoginAsync(request);
        return Ok(new { success = true, data = response });
    }

    [HttpGet("resolve-outlet/{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> ResolveOutlet(string code)
    {
        var response = await _authService.ResolveOutletAsync(code);
        return Ok(new { success = true, data = response });
    }

    [HttpPost("register-tenant")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> RegisterTenant([FromBody] RegisterTenantRequest request)
    {
        var response = await _authService.RegisterTenantAsync(request);
        return Ok(new { success = true, data = response });
    }

    [HttpPost("switch-outlet")]
    [Authorize]
    public async Task<IActionResult> SwitchOutlet([FromBody] SwitchOutletRequest request)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { success = false, message = "User not authenticated." });
        }

        var response = await _authService.SwitchOutletAsync(userId, request);
        return Ok(new { success = true, data = response });
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request);
        return Ok(new { success = true, data = response });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { success = false, message = "User not authenticated." });
        }

        var response = await _authService.GetProfileAsync(userId);
        return Ok(new { success = true, data = response });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { success = false, message = "User not authenticated." });
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
        {
            return BadRequest(new { success = false, message = "New password must be at least 8 characters." });
        }

        var user = await _context.Users
            .Find(u => u.Id == userId && u.IsActive)
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new { success = false, message = "User not found." });
        }

        // Verify current password
        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { success = false, message = "Current password is incorrect." });
        }

        // Prevent reusing the same password
        if (_passwordHasher.VerifyPassword(request.NewPassword, user.PasswordHash))
        {
            return BadRequest(new { success = false, message = "New password must be different from the current password." });
        }

        // Update password and clear MustChangePassword flag
        var update = Builders<Domain.Entities.User>.Update
            .Set(u => u.PasswordHash, _passwordHasher.HashPassword(request.NewPassword))
            .Set(u => u.MustChangePassword, false)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);

        await _context.Users.UpdateOneAsync(u => u.Id == userId, update);

        return Ok(new { success = true, message = "Password changed successfully." });
    }
}
