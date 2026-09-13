using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetBharke.Application.DTOs;
using PetBharke.Application.Interfaces;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUserService;

    public AuthController(IAuthService authService, ICurrentUserService currentUserService)
    {
        _authService = authService;
        _currentUserService = currentUserService;
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
}
