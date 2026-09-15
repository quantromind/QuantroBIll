using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using PetBharke.Domain.Enums;

namespace PetBharke.Domain.Entities;

[BsonIgnoreExtraElements]
public class Plan
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("code")]
    public string Code { get; set; } = string.Empty; // e.g. "starter", "professional", "enterprise"

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("priceMonthly")]
    public decimal PriceMonthly { get; set; } = 0;

    [BsonElement("priceYearly")]
    public decimal PriceYearly { get; set; } = 0;

    [BsonElement("maxOutlets")]
    public int MaxOutlets { get; set; } = 1;

    [BsonElement("maxStaffUsers")]
    public int MaxStaffUsers { get; set; } = 5;

    [BsonElement("trialDays")]
    public int TrialDays { get; set; } = 14;

    [BsonElement("features")]
    public Dictionary<string, bool> Features { get; set; } = new();

    [BsonElement("isPopular")]
    public bool IsPopular { get; set; } = false;

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("displayOrder")]
    public int DisplayOrder { get; set; } = 1;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class SubscriptionInvoice
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("invoiceNumber")]
    public string InvoiceNumber { get; set; } = string.Empty; // e.g. "INV-2026-001"

    [BsonElement("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    [BsonElement("tenantName")]
    public string TenantName { get; set; } = string.Empty;

    [BsonElement("planName")]
    public string PlanName { get; set; } = string.Empty;

    [BsonElement("billingCycle")]
    public string BillingCycle { get; set; } = "Monthly"; // "Monthly", "Yearly"

    [BsonElement("amount")]
    public decimal Amount { get; set; } = 0;

    [BsonElement("taxAmount")]
    public decimal TaxAmount { get; set; } = 0;

    [BsonElement("totalAmount")]
    public decimal TotalAmount { get; set; } = 0;

    [BsonElement("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("status")]
    public string Status { get; set; } = "Paid"; // "Paid", "Due", "Overdue", "Failed", "Cancelled"

    [BsonElement("dueDate")]
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(7);

    [BsonElement("paidAt")]
    public DateTime? PaidAt { get; set; }

    [BsonElement("paymentMethod")]
    public string PaymentMethod { get; set; } = "UPI"; // "UPI", "NetBanking", "CreditCard", "Offline"

    [BsonElement("transactionRef")]
    public string? TransactionRef { get; set; }

    [BsonElement("notes")]
    public string? Notes { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class Announcement
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("type")]
    public string Type { get; set; } = "Info"; // "Info", "Maintenance", "Feature", "Warning"

    [BsonElement("targetAudience")]
    public string TargetAudience { get; set; } = "All"; // "All", "Starter", "Professional", "Enterprise", "Custom"

    [BsonElement("targetTenantIds")]
    public List<string> TargetTenantIds { get; set; } = new();

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("publishedAt")]
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("expiresAt")]
    public DateTime? ExpiresAt { get; set; }

    [BsonElement("createdBy")]
    public string CreatedBy { get; set; } = "SuperAdmin";

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class PlatformCoupon
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("code")]
    public string Code { get; set; } = string.Empty; // e.g. "QUANTRO50"

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("discountType")]
    public DiscountType DiscountType { get; set; } = DiscountType.Percentage;

    [BsonElement("value")]
    public decimal Value { get; set; } = 20;

    [BsonElement("minPlanDurationMonths")]
    public int MinPlanDurationMonths { get; set; } = 3;

    [BsonElement("maxRedemptions")]
    public int MaxRedemptions { get; set; } = 100;

    [BsonElement("timesRedeemed")]
    public int TimesRedeemed { get; set; } = 0;

    [BsonElement("validFrom")]
    public DateTime ValidFrom { get; set; } = DateTime.UtcNow;

    [BsonElement("validUntil")]
    public DateTime ValidUntil { get; set; } = DateTime.UtcNow.AddMonths(3);

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("applicablePlans")]
    public List<string> ApplicablePlans { get; set; } = new(); // ["Starter", "Professional", "Enterprise"]

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class PlatformSetting
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("platformName")]
    public string PlatformName { get; set; } = "QuantroBill";

    [BsonElement("supportEmail")]
    public string SupportEmail { get; set; } = "support@quantromind.com";

    [BsonElement("supportPhone")]
    public string SupportPhone { get; set; } = "+91 99999 99999";

    [BsonElement("defaultCurrency")]
    public string DefaultCurrency { get; set; } = "INR";

    [BsonElement("defaultTaxRate")]
    public decimal DefaultTaxRate { get; set; } = 5.0m;

    [BsonElement("defaultTrialDays")]
    public int DefaultTrialDays { get; set; } = 14;

    [BsonElement("smtpHost")]
    public string SmtpHost { get; set; } = "smtp.sendgrid.net";

    [BsonElement("smtpPort")]
    public int SmtpPort { get; set; } = 587;

    [BsonElement("smtpUser")]
    public string SmtpUser { get; set; } = "apikey";

    [BsonElement("smtpFromEmail")]
    public string SmtpFromEmail { get; set; } = "noreply@quantromind.com";

    [BsonElement("razorpayKeyId")]
    public string RazorpayKeyId { get; set; } = "rzp_live_quantrobill_sample";

    [BsonElement("maintenanceMode")]
    public bool MaintenanceMode { get; set; } = false;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
