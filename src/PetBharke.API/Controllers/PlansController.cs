using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class PlansController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public PlansController(IMongoDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPlans([FromQuery] bool? activeOnly)
    {
        var filter = activeOnly == true ? Builders<Plan>.Filter.Eq(p => p.IsActive, true) : Builders<Plan>.Filter.Empty;
        var plans = await _context.Plans.Find(filter).SortBy(p => p.DisplayOrder).ToListAsync();

        return Ok(new
        {
            success = true,
            data = plans,
            total = plans.Count
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlanById(string id)
    {
        var plan = await _context.Plans.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (plan == null)
        {
            return NotFound(new { success = false, message = "Plan tier not found." });
        }

        return Ok(new { success = true, data = plan });
    }

    [HttpPost]
    public async Task<IActionResult> CreatePlan([FromBody] CreateOrUpdatePlanDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { success = false, message = "Plan name is required." });
        }

        var normalizedCode = string.IsNullOrWhiteSpace(request.Code)
            ? request.Name.Trim().ToLower().Replace(" ", "-")
            : request.Code.Trim().ToLower().Replace(" ", "-");

        var existing = await _context.Plans.Find(p => p.Code == normalizedCode).FirstOrDefaultAsync();
        if (existing != null)
        {
            return BadRequest(new { success = false, message = $"A plan with code '{normalizedCode}' already exists." });
        }

        var plan = new Plan
        {
            Name = request.Name.Trim(),
            Code = normalizedCode,
            Description = request.Description?.Trim() ?? string.Empty,
            PriceMonthly = request.PriceMonthly,
            PriceYearly = request.PriceYearly > 0 ? request.PriceYearly : request.PriceMonthly * 10,
            MaxOutlets = request.MaxOutlets > 0 ? request.MaxOutlets : 1,
            MaxStaffUsers = request.MaxStaffUsers > 0 ? request.MaxStaffUsers : 5,
            TrialDays = request.TrialDays >= 0 ? request.TrialDays : 14,
            Features = request.Features ?? new Dictionary<string, bool>
            {
                { "enableKds", true },
                { "enableWaiterApp", true },
                { "enableAggregators", true },
                { "enableRecipeInventory", true },
                { "enableKhataBook", true }
            },
            IsPopular = request.IsPopular,
            IsActive = request.IsActive,
            DisplayOrder = request.DisplayOrder > 0 ? request.DisplayOrder : 1,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Plans.InsertOneAsync(plan);

        await _auditLogService.LogAsync(
            action: "CreatePlan",
            details: $"Created new plan tier '{plan.Name}' (₹{plan.PriceMonthly}/mo, {plan.MaxOutlets} outlets max).",
            targetId: plan.Id,
            targetType: "Plan");

        return Ok(new
        {
            success = true,
            data = plan,
            message = $"Plan '{plan.Name}' created successfully."
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlan(string id, [FromBody] CreateOrUpdatePlanDto request)
    {
        var plan = await _context.Plans.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (plan == null)
        {
            return NotFound(new { success = false, message = "Plan tier not found." });
        }

        var update = Builders<Plan>.Update
            .Set(p => p.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(request.Name))
            update = update.Set(p => p.Name, request.Name.Trim());

        if (!string.IsNullOrWhiteSpace(request.Description))
            update = update.Set(p => p.Description, request.Description.Trim());

        if (request.PriceMonthly >= 0)
            update = update.Set(p => p.PriceMonthly, request.PriceMonthly);

        if (request.PriceYearly >= 0)
            update = update.Set(p => p.PriceYearly, request.PriceYearly);

        if (request.MaxOutlets > 0)
            update = update.Set(p => p.MaxOutlets, request.MaxOutlets);

        if (request.MaxStaffUsers > 0)
            update = update.Set(p => p.MaxStaffUsers, request.MaxStaffUsers);

        if (request.TrialDays >= 0)
            update = update.Set(p => p.TrialDays, request.TrialDays);

        if (request.Features != null)
            update = update.Set(p => p.Features, request.Features);

        update = update.Set(p => p.IsPopular, request.IsPopular);
        update = update.Set(p => p.IsActive, request.IsActive);

        if (request.DisplayOrder > 0)
            update = update.Set(p => p.DisplayOrder, request.DisplayOrder);

        await _context.Plans.UpdateOneAsync(p => p.Id == id, update);

        await _auditLogService.LogAsync(
            action: "UpdatePlan",
            details: $"Updated plan tier '{plan.Name}' settings & pricing.",
            targetId: id,
            targetType: "Plan");

        return Ok(new
        {
            success = true,
            message = $"Plan '{plan.Name}' updated successfully."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> ArchivePlan(string id)
    {
        var plan = await _context.Plans.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (plan == null)
        {
            return NotFound(new { success = false, message = "Plan tier not found." });
        }

        // Soft archive by deactivating
        await _context.Plans.UpdateOneAsync(
            p => p.Id == id,
            Builders<Plan>.Update.Set(p => p.IsActive, false).Set(p => p.UpdatedAt, DateTime.UtcNow));

        await _auditLogService.LogAsync(
            action: "ArchivePlan",
            details: $"Archived/deactivated plan tier '{plan.Name}'.",
            targetId: id,
            targetType: "Plan");

        return Ok(new
        {
            success = true,
            message = $"Plan '{plan.Name}' has been archived."
        });
    }
}

public class CreateOrUpdatePlanDto
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public decimal PriceMonthly { get; set; } = 0;
    public decimal PriceYearly { get; set; } = 0;
    public int MaxOutlets { get; set; } = 1;
    public int MaxStaffUsers { get; set; } = 5;
    public int TrialDays { get; set; } = 14;
    public Dictionary<string, bool>? Features { get; set; }
    public bool IsPopular { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 1;
}
