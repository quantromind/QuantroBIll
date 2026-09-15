using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/platform/[controller]")]
public class CouponsController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public CouponsController(IMongoDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAllCoupons()
    {
        var coupons = await _context.PlatformCoupons.Find(_ => true)
            .SortByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = coupons,
            total = coupons.Count
        });
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetCouponById(string id)
    {
        var coupon = await _context.PlatformCoupons.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (coupon == null)
        {
            return NotFound(new { success = false, message = "Coupon not found." });
        }

        return Ok(new { success = true, data = coupon });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new { success = false, message = "Coupon code is required." });
        }

        var normalizedCode = request.Code.Trim().ToUpper();
        var existing = await _context.PlatformCoupons.Find(c => c.Code == normalizedCode).FirstOrDefaultAsync();
        if (existing != null)
        {
            return BadRequest(new { success = false, message = $"Coupon code '{normalizedCode}' already exists." });
        }

        var coupon = new PlatformCoupon
        {
            Code = normalizedCode,
            Description = request.Description?.Trim() ?? string.Empty,
            DiscountType = request.DiscountType,
            Value = request.Value,
            MinPlanDurationMonths = request.MinPlanDurationMonths > 0 ? request.MinPlanDurationMonths : 1,
            MaxRedemptions = request.MaxRedemptions > 0 ? request.MaxRedemptions : 100,
            TimesRedeemed = 0,
            ValidFrom = request.ValidFrom ?? DateTime.UtcNow,
            ValidUntil = request.ValidUntil ?? DateTime.UtcNow.AddMonths(3),
            IsActive = request.IsActive,
            ApplicablePlans = request.ApplicablePlans ?? new List<string> { "Starter", "Professional", "Enterprise" },
            CreatedAt = DateTime.UtcNow
        };

        await _context.PlatformCoupons.InsertOneAsync(coupon);

        await _auditLogService.LogAsync(
            action: "CreateCoupon",
            details: $"Created coupon '{coupon.Code}' ({coupon.DiscountType}: {coupon.Value}).",
            targetId: coupon.Id,
            targetType: "Coupon");

        return Ok(new
        {
            success = true,
            data = coupon,
            message = $"Coupon '{coupon.Code}' created successfully."
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdateCoupon(string id, [FromBody] CreateCouponDto request)
    {
        var coupon = await _context.PlatformCoupons.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (coupon == null)
        {
            return NotFound(new { success = false, message = "Coupon not found." });
        }

        var update = Builders<PlatformCoupon>.Update
            .Set(c => c.Description, request.Description?.Trim() ?? string.Empty)
            .Set(c => c.DiscountType, request.DiscountType)
            .Set(c => c.Value, request.Value)
            .Set(c => c.MinPlanDurationMonths, request.MinPlanDurationMonths)
            .Set(c => c.MaxRedemptions, request.MaxRedemptions)
            .Set(c => c.IsActive, request.IsActive);

        if (request.ValidFrom.HasValue)
            update = update.Set(c => c.ValidFrom, request.ValidFrom.Value);

        if (request.ValidUntil.HasValue)
            update = update.Set(c => c.ValidUntil, request.ValidUntil.Value);

        if (request.ApplicablePlans != null)
            update = update.Set(c => c.ApplicablePlans, request.ApplicablePlans);

        await _context.PlatformCoupons.UpdateOneAsync(c => c.Id == id, update);

        await _auditLogService.LogAsync(
            action: "UpdateCoupon",
            details: $"Updated coupon '{coupon.Code}'.",
            targetId: id,
            targetType: "Coupon");

        return Ok(new
        {
            success = true,
            message = $"Coupon '{coupon.Code}' updated successfully."
        });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ToggleCouponStatus(string id, [FromBody] ToggleStatusDto request)
    {
        var coupon = await _context.PlatformCoupons.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (coupon == null)
        {
            return NotFound(new { success = false, message = "Coupon not found." });
        }

        await _context.PlatformCoupons.UpdateOneAsync(
            c => c.Id == id,
            Builders<PlatformCoupon>.Update.Set(c => c.IsActive, request.IsActive));

        await _auditLogService.LogAsync(
            action: "ToggleCouponStatus",
            details: $"Changed coupon '{coupon.Code}' active state to {request.IsActive}.",
            targetId: id,
            targetType: "Coupon");

        return Ok(new
        {
            success = true,
            message = $"Coupon status changed to {(request.IsActive ? "Active" : "Inactive")}."
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> DeleteCoupon(string id)
    {
        var coupon = await _context.PlatformCoupons.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (coupon == null)
        {
            return NotFound(new { success = false, message = "Coupon not found." });
        }

        await _context.PlatformCoupons.DeleteOneAsync(c => c.Id == id);

        await _auditLogService.LogAsync(
            action: "DeleteCoupon",
            details: $"Deleted coupon '{coupon.Code}'.",
            targetId: id,
            targetType: "Coupon");

        return Ok(new
        {
            success = true,
            message = $"Coupon '{coupon.Code}' deleted successfully."
        });
    }

    [HttpGet("validate")]
    public async Task<IActionResult> ValidateCoupon([FromQuery] string code, [FromQuery] string? plan)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest(new { success = false, message = "Coupon code is required." });
        }

        var normalized = code.Trim().ToUpper();
        var coupon = await _context.PlatformCoupons.Find(c => c.Code == normalized && c.IsActive).FirstOrDefaultAsync();
        if (coupon == null)
        {
            return NotFound(new { success = false, message = "Invalid or inactive coupon code." });
        }

        var now = DateTime.UtcNow;
        if (now < coupon.ValidFrom || now > coupon.ValidUntil)
        {
            return BadRequest(new { success = false, message = "This coupon code has expired or is not yet active." });
        }

        if (coupon.TimesRedeemed >= coupon.MaxRedemptions)
        {
            return BadRequest(new { success = false, message = "This coupon code has reached its maximum redemption limit." });
        }

        if (!string.IsNullOrWhiteSpace(plan) && coupon.ApplicablePlans.Count > 0 && !coupon.ApplicablePlans.Contains(plan, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new { success = false, message = $"Coupon is not applicable to the '{plan}' plan tier." });
        }

        return Ok(new
        {
            success = true,
            data = coupon,
            message = "Coupon applied successfully."
        });
    }
}

public class CreateCouponDto
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.Percentage;
    public decimal Value { get; set; }
    public int MinPlanDurationMonths { get; set; } = 1;
    public int MaxRedemptions { get; set; } = 100;
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool IsActive { get; set; } = true;
    public List<string>? ApplicablePlans { get; set; }
}
