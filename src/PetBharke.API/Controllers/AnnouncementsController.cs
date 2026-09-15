using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnnouncementsController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public AnnouncementsController(IMongoDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAllAnnouncements()
    {
        var announcements = await _context.Announcements.Find(_ => true)
            .SortByDescending(a => a.PublishedAt)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = announcements,
            total = announcements.Count
        });
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAnnouncementById(string id)
    {
        var announcement = await _context.Announcements.Find(a => a.Id == id).FirstOrDefaultAsync();
        if (announcement == null)
        {
            return NotFound(new { success = false, message = "Announcement not found." });
        }

        return Ok(new { success = true, data = announcement });
    }

    [HttpGet("active")]
    [Authorize]
    public async Task<IActionResult> GetActiveAnnouncements()
    {
        var now = DateTime.UtcNow;
        var filter = Builders<Announcement>.Filter.Eq(a => a.IsActive, true) &
                     (Builders<Announcement>.Filter.Eq(a => a.ExpiresAt, null) | Builders<Announcement>.Filter.Gte(a => a.ExpiresAt, now));

        var active = await _context.Announcements.Find(filter)
            .SortByDescending(a => a.PublishedAt)
            .ToListAsync();

        return Ok(new { success = true, data = active });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { success = false, message = "Announcement title is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { success = false, message = "Announcement message content is required." });
        }

        var announcement = new Announcement
        {
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            Type = request.Type ?? "Info",
            TargetAudience = request.TargetAudience ?? "All",
            TargetTenantIds = request.TargetTenantIds ?? new List<string>(),
            IsActive = request.IsActive,
            PublishedAt = DateTime.UtcNow,
            ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(14),
            CreatedBy = "Platform Super Admin",
            CreatedAt = DateTime.UtcNow
        };

        await _context.Announcements.InsertOneAsync(announcement);

        await _auditLogService.LogAsync(
            action: "CreateAnnouncement",
            details: $"Published platform announcement '{announcement.Title}' to {announcement.TargetAudience}.",
            targetId: announcement.Id,
            targetType: "Announcement");

        return Ok(new
        {
            success = true,
            data = announcement,
            message = "Announcement published successfully."
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdateAnnouncement(string id, [FromBody] CreateAnnouncementDto request)
    {
        var announcement = await _context.Announcements.Find(a => a.Id == id).FirstOrDefaultAsync();
        if (announcement == null)
        {
            return NotFound(new { success = false, message = "Announcement not found." });
        }

        var update = Builders<Announcement>.Update
            .Set(a => a.Title, request.Title.Trim())
            .Set(a => a.Message, request.Message.Trim())
            .Set(a => a.Type, request.Type ?? announcement.Type)
            .Set(a => a.TargetAudience, request.TargetAudience ?? announcement.TargetAudience)
            .Set(a => a.IsActive, request.IsActive);

        if (request.ExpiresAt.HasValue)
            update = update.Set(a => a.ExpiresAt, request.ExpiresAt.Value);

        if (request.TargetTenantIds != null)
            update = update.Set(a => a.TargetTenantIds, request.TargetTenantIds);

        await _context.Announcements.UpdateOneAsync(a => a.Id == id, update);

        await _auditLogService.LogAsync(
            action: "UpdateAnnouncement",
            details: $"Updated announcement '{announcement.Title}'.",
            targetId: id,
            targetType: "Announcement");

        return Ok(new
        {
            success = true,
            message = "Announcement updated successfully."
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> DeleteAnnouncement(string id)
    {
        var announcement = await _context.Announcements.Find(a => a.Id == id).FirstOrDefaultAsync();
        if (announcement == null)
        {
            return NotFound(new { success = false, message = "Announcement not found." });
        }

        await _context.Announcements.DeleteOneAsync(a => a.Id == id);

        await _auditLogService.LogAsync(
            action: "DeleteAnnouncement",
            details: $"Deleted announcement '{announcement.Title}'.",
            targetId: id,
            targetType: "Announcement");

        return Ok(new
        {
            success = true,
            message = "Announcement deleted successfully."
        });
    }
}

public class CreateAnnouncementDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Type { get; set; } = "Info";
    public string? TargetAudience { get; set; } = "All";
    public List<string>? TargetTenantIds { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
}
