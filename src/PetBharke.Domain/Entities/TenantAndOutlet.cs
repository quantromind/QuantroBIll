using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using PetBharke.Domain.Common;
using PetBharke.Domain.Enums;

namespace PetBharke.Domain.Entities;

[BsonIgnoreExtraElements]
public class Tenant
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("businessName")]
    public string BusinessName { get; set; } = string.Empty;

    [BsonElement("legalName")]
    public string LegalName { get; set; } = string.Empty;

    [BsonElement("ownerEmail")]
    public string OwnerEmail { get; set; } = string.Empty;

    [BsonElement("ownerPhone")]
    public string OwnerPhone { get; set; } = string.Empty;

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("state")]
    public string State { get; set; } = string.Empty;

    [BsonElement("gstin")]
    public string GSTIN { get; set; } = string.Empty;

    [BsonElement("subscriptionPlan")]
    public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Standard;

    [BsonElement("businessType")]
    public BusinessType BusinessType { get; set; } = BusinessType.Cafe;

    [BsonElement("subscriptionExpiresAt")]
    public DateTime? SubscriptionExpiresAt { get; set; }

    [BsonElement("maxOutlets")]
    public int MaxOutlets { get; set; } = 5;

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("features")]
    public Dictionary<string, bool> Features { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}

public class Outlet : BaseEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("businessType")]
    public BusinessType BusinessType { get; set; } = BusinessType.Cafe;

    [BsonElement("code")]
    public string Code { get; set; } = string.Empty; // e.g. R443077

    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("gstin")]
    public string GSTIN { get; set; } = string.Empty;

    [BsonElement("fssai")]
    public string FSSAI { get; set; } = string.Empty;

    [BsonElement("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("taxSettings")]
    public OutletTaxSettings TaxSettings { get; set; } = new();

    [BsonElement("printerSettings")]
    public OutletPrinterSettings PrinterSettings { get; set; } = new();

    [BsonElement("isOpen")]
    public bool IsOpen { get; set; } = true;
}

public class OutletTaxSettings
{
    [BsonElement("cgstPercentage")]
    public decimal CgstPercentage { get; set; } = 2.5m;

    [BsonElement("sgstPercentage")]
    public decimal SgstPercentage { get; set; } = 2.5m;

    [BsonElement("isGstInclusive")]
    public bool IsGstInclusive { get; set; } = false;

    [BsonElement("serviceChargePercentage")]
    public decimal ServiceChargePercentage { get; set; } = 0.0m;
}

public class OutletPrinterSettings
{
    [BsonElement("printerType")]
    public string PrinterType { get; set; } = "Thermal80mm"; // Thermal58mm, Thermal80mm

    [BsonElement("headerText")]
    public string HeaderText { get; set; } = "Thank you for visiting!";

    [BsonElement("footerText")]
    public string FooterText { get; set; } = "Visit again soon!";

    [BsonElement("autoPrintKOT")]
    public bool AutoPrintKOT { get; set; } = true;

    [BsonElement("autoPrintBill")]
    public bool AutoPrintBill { get; set; } = true;
}
