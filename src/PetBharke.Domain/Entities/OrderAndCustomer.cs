using MongoDB.Bson.Serialization.Attributes;
using PetBharke.Domain.Common;
using PetBharke.Domain.Enums;

namespace PetBharke.Domain.Entities;

public class Order : BaseEntity
{
    [BsonElement("billNumber")]
    public string BillNumber { get; set; } = string.Empty; // e.g. "BILL-74"

    [BsonElement("kotNumber")]
    public string KotNumber { get; set; } = string.Empty; // e.g. "KOT-104"

    [BsonElement("orderType")]
    public OrderType OrderType { get; set; } = OrderType.DineIn;

    [BsonElement("status")]
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    [BsonElement("tableNumber")]
    public string? TableNumber { get; set; }

    [BsonElement("tokenNumber")]
    public int? TokenNumber { get; set; }

    [BsonElement("items")]
    public List<OrderItem> Items { get; set; } = new();

    [BsonElement("subTotal")]
    public decimal SubTotal { get; set; }

    [BsonElement("discountAmount")]
    public decimal DiscountAmount { get; set; }

    [BsonElement("cgstAmount")]
    public decimal CgstAmount { get; set; }

    [BsonElement("sgstAmount")]
    public decimal SgstAmount { get; set; }

    [BsonElement("deliveryCharges")]
    public decimal DeliveryCharges { get; set; }

    [BsonElement("roundOff")]
    public decimal RoundOff { get; set; }

    [BsonElement("totalAmount")]
    public decimal TotalAmount { get; set; }

    [BsonElement("payments")]
    public List<OrderPayment> Payments { get; set; } = new();

    [BsonElement("customerId")]
    public string? CustomerId { get; set; }

    [BsonElement("customerName")]
    public string? CustomerName { get; set; }

    [BsonElement("customerPhone")]
    public string? CustomerPhone { get; set; }

    [BsonElement("customerAddress")]
    public string? CustomerAddress { get; set; }

    [BsonElement("aggregatorSource")]
    public AggregatorSource AggregatorSource { get; set; } = AggregatorSource.Direct;

    [BsonElement("externalOrderId")]
    public string? ExternalOrderId { get; set; } // Zomato/Swiggy order ID e.g. 8242905005

    [BsonElement("otp")]
    public string? Otp { get; set; } // e.g. 6664

    [BsonElement("deliveryInstructions")]
    public string? DeliveryInstructions { get; set; }

    [BsonElement("riderDetails")]
    public RiderDetails? RiderDetails { get; set; }

    [BsonElement("orderNotes")]
    public string? OrderNotes { get; set; }

    [BsonElement("billerUserId")]
    public string? BillerUserId { get; set; }

    [BsonElement("billerName")]
    public string? BillerName { get; set; }

    [BsonElement("isHold")]
    public bool IsHold { get; set; } = false;

    // Timeline timestamps for full audit trail
    [BsonElement("placedAt")]
    public DateTime PlacedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("acceptedAt")]
    public DateTime? AcceptedAt { get; set; }

    [BsonElement("foodReadyAt")]
    public DateTime? FoodReadyAt { get; set; }

    [BsonElement("dispatchedAt")]
    public DateTime? DispatchedAt { get; set; }

    [BsonElement("deliveredAt")]
    public DateTime? DeliveredAt { get; set; }

    [BsonElement("cancelledAt")]
    public DateTime? CancelledAt { get; set; }
}

public class OrderItem
{
    [BsonElement("menuItemId")]
    public string MenuItemId { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("quantity")]
    public int Quantity { get; set; } = 1;

    [BsonElement("unitPrice")]
    public decimal UnitPrice { get; set; }

    [BsonElement("totalPrice")]
    public decimal TotalPrice { get; set; }

    [BsonElement("variantName")]
    public string? VariantName { get; set; }

    [BsonElement("selectedAddOns")]
    public List<string> SelectedAddOns { get; set; } = new();

    [BsonElement("itemNote")]
    public string? ItemNote { get; set; }

    [BsonElement("isVeg")]
    public bool IsVeg { get; set; } = true;
}

public class OrderPayment
{
    [BsonElement("mode")]
    public PaymentMode Mode { get; set; } = PaymentMode.Cash;

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("referenceNumber")]
    public string? ReferenceNumber { get; set; }

    [BsonElement("paidAt")]
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
}

public class RiderDetails
{
    [BsonElement("riderName")]
    public string RiderName { get; set; } = string.Empty;

    [BsonElement("riderPhone")]
    public string RiderPhone { get; set; } = string.Empty;

    [BsonElement("deliveryBoyUserId")]
    public string? DeliveryBoyUserId { get; set; }
}

public class Customer : BaseEntity
{
    [BsonElement("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("email")]
    public string? Email { get; set; }

    [BsonElement("address")]
    public string? Address { get; set; }

    [BsonElement("loyaltyPoints")]
    public int LoyaltyPoints { get; set; } = 0;

    [BsonElement("totalOrdersCount")]
    public int TotalOrdersCount { get; set; } = 0;

    [BsonElement("totalSpent")]
    public decimal TotalSpent { get; set; } = 0;

    [BsonElement("lastOrderAt")]
    public DateTime? LastOrderAt { get; set; }
}
