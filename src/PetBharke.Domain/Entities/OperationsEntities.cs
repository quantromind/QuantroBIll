using MongoDB.Bson.Serialization.Attributes;
using PetBharke.Domain.Common;
using PetBharke.Domain.Enums;

namespace PetBharke.Domain.Entities;

public class RestaurantTable : BaseEntity
{
    [BsonElement("tableNumber")]
    public string TableNumber { get; set; } = string.Empty;

    [BsonElement("section")]
    public string Section { get; set; } = "Main Hall"; // AC, Rooftop, Garden

    [BsonElement("seatingCapacity")]
    public int SeatingCapacity { get; set; } = 4;

    [BsonElement("isOccupied")]
    public bool IsOccupied { get; set; } = false;

    [BsonElement("currentOrderId")]
    public string? CurrentOrderId { get; set; }
}

public class InventoryItem : BaseEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = "Dairy"; // Dairy, Produce, Packaging, Spices

    [BsonElement("unit")]
    public string Unit { get; set; } = "kg"; // kg, litre, pcs, gm, ml

    [BsonElement("currentStock")]
    public decimal CurrentStock { get; set; }

    [BsonElement("minimumStockAlert")]
    public decimal MinimumStockAlert { get; set; }

    [BsonElement("costPerUnit")]
    public decimal CostPerUnit { get; set; }

    [BsonElement("supplierName")]
    public string? SupplierName { get; set; }
}

public class Expense : BaseEntity
{
    [BsonElement("category")]
    public string Category { get; set; } = "Supplies"; // Supplies, Utilities, Maintenance, Staff, Rent

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("paymentMode")]
    public PaymentMode PaymentMode { get; set; } = PaymentMode.Cash;

    [BsonElement("receiptUrl")]
    public string? ReceiptUrl { get; set; }

    [BsonElement("paidBy")]
    public string PaidBy { get; set; } = string.Empty;

    [BsonElement("expenseDate")]
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
}

public class CashFlowEntry : BaseEntity
{
    [BsonElement("type")]
    public string Type { get; set; } = "OpeningCash"; // OpeningCash, CashTopUp, Withdrawal, ClosingCash

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("note")]
    public string Note { get; set; } = string.Empty;

    [BsonElement("performedByUserId")]
    public string PerformedByUserId { get; set; } = string.Empty;

    [BsonElement("performedByName")]
    public string PerformedByName { get; set; } = string.Empty;

    [BsonElement("entryDate")]
    public DateTime EntryDate { get; set; } = DateTime.UtcNow;
}

public class Discount : BaseEntity
{
    [BsonElement("code")]
    public string Code { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("type")]
    public DiscountType Type { get; set; } = DiscountType.Percentage;

    [BsonElement("value")]
    public decimal Value { get; set; }

    [BsonElement("minOrderAmount")]
    public decimal MinOrderAmount { get; set; } = 0;

    [BsonElement("maxDiscountAmount")]
    public decimal? MaxDiscountAmount { get; set; }

    [BsonElement("validFrom")]
    public DateTime ValidFrom { get; set; } = DateTime.UtcNow;

    [BsonElement("validUntil")]
    public DateTime ValidUntil { get; set; } = DateTime.UtcNow.AddMonths(1);

    [BsonElement("usageCount")]
    public int UsageCount { get; set; } = 0;
}

public class Feedback : BaseEntity
{
    [BsonElement("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [BsonElement("customerPhone")]
    public string CustomerPhone { get; set; } = string.Empty;

    [BsonElement("rating")]
    public int Rating { get; set; } = 5; // 1 to 5

    [BsonElement("foodRating")]
    public int FoodRating { get; set; } = 5;

    [BsonElement("serviceRating")]
    public int ServiceRating { get; set; } = 5;

    [BsonElement("comments")]
    public string? Comments { get; set; }
}

public class AuditLog
{
    [BsonId]
    [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    [BsonElement("outletId")]
    public string? OutletId { get; set; }

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("userName")]
    public string UserName { get; set; } = string.Empty;

    [BsonElement("action")]
    public string Action { get; set; } = string.Empty; // e.g. "CreateOrder", "CancelOrder", "ApplyDiscount"

    [BsonElement("details")]
    public string Details { get; set; } = string.Empty;

    [BsonElement("ipAddress")]
    public string? IpAddress { get; set; }

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
