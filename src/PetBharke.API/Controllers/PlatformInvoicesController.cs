using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/platform/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class InvoicesController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public InvoicesController(IMongoDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var builder = Builders<SubscriptionInvoice>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            filter &= (builder.Regex(i => i.InvoiceNumber, new MongoDB.Bson.BsonRegularExpression(s, "i")) |
                       builder.Regex(i => i.TenantName, new MongoDB.Bson.BsonRegularExpression(s, "i")) |
                       builder.Regex(i => i.PlanName, new MongoDB.Bson.BsonRegularExpression(s, "i")));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            filter &= builder.Eq(i => i.Status, status.Trim());
        }

        var totalItems = await _context.SubscriptionInvoices.CountDocumentsAsync(filter);
        var invoices = await _context.SubscriptionInvoices.Find(filter)
            .SortByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = invoices,
            pagination = new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInvoiceById(string id)
    {
        var invoice = await _context.SubscriptionInvoices.Find(i => i.Id == id).FirstOrDefaultAsync();
        if (invoice == null)
        {
            return NotFound(new { success = false, message = "Subscription invoice not found." });
        }

        var tenant = await _context.Tenants.Find(t => t.Id == invoice.TenantId).FirstOrDefaultAsync();

        return Ok(new
        {
            success = true,
            data = invoice,
            tenant = tenant != null ? new
            {
                tenant.Id,
                tenant.BusinessName,
                tenant.OwnerEmail,
                tenant.OwnerPhone,
                tenant.GSTIN,
                tenant.City,
                tenant.State
            } : null
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto request)
    {
        if (string.IsNullOrWhiteSpace(request.TenantId))
        {
            return BadRequest(new { success = false, message = "Tenant ID is required." });
        }

        var tenant = await _context.Tenants.Find(t => t.Id == request.TenantId).FirstOrDefaultAsync();
        if (tenant == null)
        {
            return NotFound(new { success = false, message = "Associated restaurant tenant not found." });
        }

        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{new Random().Next(1000, 9999)}";
        var amount = request.Amount > 0 ? request.Amount : 2499m;
        var tax = Math.Round(amount * 0.18m, 2); // 18% GST standard
        var total = amount + tax;

        var invoice = new SubscriptionInvoice
        {
            InvoiceNumber = invoiceNumber,
            TenantId = tenant.Id,
            TenantName = tenant.BusinessName,
            PlanName = string.IsNullOrWhiteSpace(request.PlanName) ? tenant.SubscriptionPlan.ToString() : request.PlanName.Trim(),
            BillingCycle = request.BillingCycle ?? "Monthly",
            Amount = amount,
            TaxAmount = tax,
            TotalAmount = total,
            Currency = request.Currency ?? "INR",
            Status = request.Status ?? "Paid",
            DueDate = request.DueDate ?? DateTime.UtcNow.AddDays(7),
            PaidAt = request.Status == "Paid" ? DateTime.UtcNow : null,
            PaymentMethod = request.PaymentMethod ?? "UPI",
            TransactionRef = request.TransactionRef,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await _context.SubscriptionInvoices.InsertOneAsync(invoice);

        await _auditLogService.LogAsync(
            action: "CreateInvoice",
            details: $"Generated manual invoice {invoice.InvoiceNumber} for {tenant.BusinessName} (₹{invoice.TotalAmount}).",
            targetId: invoice.Id,
            targetType: "Invoice",
            tenantId: tenant.Id);

        return Ok(new
        {
            success = true,
            data = invoice,
            message = $"Invoice {invoice.InvoiceNumber} generated successfully."
        });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateInvoiceStatus(string id, [FromBody] UpdateInvoiceStatusDto request)
    {
        var invoice = await _context.SubscriptionInvoices.Find(i => i.Id == id).FirstOrDefaultAsync();
        if (invoice == null)
        {
            return NotFound(new { success = false, message = "Invoice not found." });
        }

        var update = Builders<SubscriptionInvoice>.Update
            .Set(i => i.Status, request.Status)
            .Set(i => i.UpdatedAt, DateTime.UtcNow);

        if (request.Status == "Paid")
        {
            update = update.Set(i => i.PaidAt, DateTime.UtcNow);
            if (!string.IsNullOrWhiteSpace(request.PaymentMethod))
                update = update.Set(i => i.PaymentMethod, request.PaymentMethod.Trim());
            if (!string.IsNullOrWhiteSpace(request.TransactionRef))
                update = update.Set(i => i.TransactionRef, request.TransactionRef.Trim());
        }

        await _context.SubscriptionInvoices.UpdateOneAsync(i => i.Id == id, update);

        await _auditLogService.LogAsync(
            action: "UpdateInvoiceStatus",
            details: $"Updated status of invoice {invoice.InvoiceNumber} to '{request.Status}'.",
            targetId: id,
            targetType: "Invoice",
            tenantId: invoice.TenantId);

        return Ok(new
        {
            success = true,
            message = $"Invoice status updated to {request.Status}."
        });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetBillingStats()
    {
        var allInvoices = await _context.SubscriptionInvoices.Find(_ => true).ToListAsync();
        var totalTenants = await _context.Tenants.CountDocumentsAsync(t => t.IsActive);

        var totalRevenue = allInvoices.Where(i => i.Status == "Paid").Sum(i => i.TotalAmount);
        var overdueCount = allInvoices.Count(i => i.Status == "Overdue");
        var dueCount = allInvoices.Count(i => i.Status == "Due");

        // Estimated MRR based on active tenants and plan prices
        var starterCount = await _context.Tenants.CountDocumentsAsync(t => t.IsActive && t.SubscriptionPlan == PetBharke.Domain.Enums.SubscriptionPlan.Basic);
        var proCount = await _context.Tenants.CountDocumentsAsync(t => t.IsActive && t.SubscriptionPlan == PetBharke.Domain.Enums.SubscriptionPlan.Standard);
        var entCount = await _context.Tenants.CountDocumentsAsync(t => t.IsActive && (t.SubscriptionPlan == PetBharke.Domain.Enums.SubscriptionPlan.Premium || t.SubscriptionPlan == PetBharke.Domain.Enums.SubscriptionPlan.Enterprise));

        var mrr = (starterCount * 999) + (proCount * 2499) + (entCount * 5999);
        var arr = mrr * 12;

        return Ok(new
        {
            success = true,
            data = new
            {
                totalRevenue,
                mrr,
                arr,
                overdueCount,
                dueCount,
                activeSubscriptions = totalTenants,
                totalInvoices = allInvoices.Count
            }
        });
    }
}

public class CreateInvoiceDto
{
    public string TenantId { get; set; } = string.Empty;
    public string? PlanName { get; set; }
    public decimal Amount { get; set; }
    public string? BillingCycle { get; set; }
    public string? Currency { get; set; } = "INR";
    public string? Status { get; set; } = "Paid";
    public DateTime? DueDate { get; set; }
    public string? PaymentMethod { get; set; } = "UPI";
    public string? TransactionRef { get; set; }
    public string? Notes { get; set; }
}

public class UpdateInvoiceStatusDto
{
    public string Status { get; set; } = "Paid";
    public string? PaymentMethod { get; set; }
    public string? TransactionRef { get; set; }
}
