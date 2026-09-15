using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/superadmin/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class TeamController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditLogService _auditLogService;

    public TeamController(
        IMongoDbContext context,
        ICurrentUserService currentUserService,
        IPasswordHasher passwordHasher,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTeamMembers()
    {
        // Platform team are users with Role == SuperAdmin or null/empty TenantId
        var filter = Builders<User>.Filter.Or(
            Builders<User>.Filter.Eq(u => u.Role, UserRole.SuperAdmin),
            Builders<User>.Filter.Eq(u => u.TenantId, string.Empty),
            Builders<User>.Filter.Eq(u => u.TenantId, "Platform")
        );

        var team = await _context.Users.Find(filter).ToListAsync();

        var result = team.Select(u => new
        {
            u.Id,
            u.Username,
            u.Email,
            u.FullName,
            u.Phone,
            Role = u.Role.ToString(),
            u.Permissions,
            u.IsActive,
            u.LastLoginAt,
            u.CreatedAt
        });

        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTeamMemberById(string id)
    {
        var user = await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user == null)
        {
            return NotFound(new { success = false, message = "Team member not found." });
        }

        return Ok(new
        {
            success = true,
            data = new
            {
                user.Id,
                user.Username,
                user.Email,
                user.FullName,
                user.Phone,
                Role = user.Role.ToString(),
                user.Permissions,
                user.IsActive,
                user.LastLoginAt,
                user.CreatedAt
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTeamMember([FromBody] CreateTeamMemberDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { success = false, message = "Email is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { success = false, message = "Password is required." });
        }

        var normalizedEmail = request.Email.Trim().ToLower();
        var existing = await _context.Users.Find(u => u.Email.ToLower() == normalizedEmail).FirstOrDefaultAsync();
        if (existing != null)
        {
            return BadRequest(new { success = false, message = "A user with this email address already exists." });
        }

        var user = new User
        {
            TenantId = "Platform",
            OutletId = string.Empty,
            Username = string.IsNullOrWhiteSpace(request.Username) ? normalizedEmail.Split('@')[0] : request.Username.Trim(),
            Email = normalizedEmail,
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? normalizedEmail.Split('@')[0] : request.FullName.Trim(),
            Phone = request.Phone?.Trim() ?? string.Empty,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Role = UserRole.SuperAdmin, // Scoped to SuperAdmin role
            Permissions = request.Permissions ?? new List<string> { "tenants.read", "logs.read" },
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.InsertOneAsync(user);

        await _auditLogService.LogAsync(
            action: "CreatePlatformStaff",
            details: $"Added platform staff member '{user.FullName}' ({user.Email}).",
            targetId: user.Id,
            targetType: "PlatformStaff");

        return Ok(new
        {
            success = true,
            data = new
            {
                user.Id,
                user.Username,
                user.Email,
                user.FullName,
                user.Phone,
                Role = user.Role.ToString(),
                user.Permissions,
                user.IsActive
            },
            message = $"Team member '{user.FullName}' created successfully."
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTeamMember(string id, [FromBody] UpdateTeamMemberDto request)
    {
        var user = await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user == null)
        {
            return NotFound(new { success = false, message = "Team member not found." });
        }

        var update = Builders<User>.Update.Set(u => u.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(request.FullName))
            update = update.Set(u => u.FullName, request.FullName.Trim());

        if (!string.IsNullOrWhiteSpace(request.Phone))
            update = update.Set(u => u.Phone, request.Phone.Trim());

        if (!string.IsNullOrWhiteSpace(request.Password))
            update = update.Set(u => u.PasswordHash, _passwordHasher.HashPassword(request.Password));

        if (request.Permissions != null)
            update = update.Set(u => u.Permissions, request.Permissions);

        if (request.IsActive.HasValue)
            update = update.Set(u => u.IsActive, request.IsActive.Value);

        await _context.Users.UpdateOneAsync(u => u.Id == id, update);

        await _auditLogService.LogAsync(
            action: "UpdatePlatformStaff",
            details: $"Updated platform staff member '{user.FullName}'.",
            targetId: id,
            targetType: "PlatformStaff");

        return Ok(new
        {
            success = true,
            message = $"Team member '{user.FullName}' updated successfully."
        });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(string id, [FromBody] ToggleStatusDto request)
    {
        if (id == _currentUserService.UserId)
        {
            return BadRequest(new { success = false, message = "You cannot deactivate your own administrative account." });
        }

        var user = await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user == null)
        {
            return NotFound(new { success = false, message = "Team member not found." });
        }

        await _context.Users.UpdateOneAsync(
            u => u.Id == id,
            Builders<User>.Update.Set(u => u.IsActive, request.IsActive).Set(u => u.UpdatedAt, DateTime.UtcNow));

        await _auditLogService.LogAsync(
            action: "TogglePlatformStaffStatus",
            details: $"Changed status of platform staff '{user.FullName}' to {(request.IsActive ? "Active" : "Inactive")}.",
            targetId: id,
            targetType: "PlatformStaff");

        return Ok(new
        {
            success = true,
            message = $"Team member status updated to {(request.IsActive ? "Active" : "Inactive")}."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTeamMember(string id)
    {
        if (id == _currentUserService.UserId)
        {
            return BadRequest(new { success = false, message = "You cannot delete your own account." });
        }

        var user = await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user == null)
        {
            return NotFound(new { success = false, message = "Team member not found." });
        }

        if (user.Email.ToLower() == "admin@quantromind.com")
        {
            return BadRequest(new { success = false, message = "Root SuperAdmin account cannot be deleted." });
        }

        await _context.Users.DeleteOneAsync(u => u.Id == id);

        await _auditLogService.LogAsync(
            action: "DeletePlatformStaff",
            details: $"Deleted platform staff member '{user.FullName}' ({user.Email}).",
            targetId: id,
            targetType: "PlatformStaff");

        return Ok(new
        {
            success = true,
            message = $"Team member '{user.FullName}' has been removed."
        });
    }
}

public class CreateTeamMemberDto
{
    public string Email { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string Password { get; set; } = string.Empty;
    public List<string>? Permissions { get; set; }
}

public class UpdateTeamMemberDto
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Password { get; set; }
    public List<string>? Permissions { get; set; }
    public bool? IsActive { get; set; }
}
