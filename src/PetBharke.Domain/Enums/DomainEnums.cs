namespace PetBharke.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 1,
    Owner = 2,           // Restaurant Owner
    Cashier = 3,         // Biller
    KitchenStaff = 4,    // KDS
    DeliveryBoy = 5,     // Rider
    Waiter = 6,          // Floor Waiter
    Captain = 7,         // Table Captain
    Manager = 8          // Store Manager
}

public enum OrderType
{
    DineIn = 1,
    Delivery = 2,
    PickUp = 3,
    TakeAway = 4,
    Parcel = 5
}

public enum OrderStatus
{
    Pending = 1,
    KotCreated = 2,
    FoodReady = 3,
    Dispatched = 4,
    Delivered = 5,
    Cancelled = 6
}

public enum PaymentMode
{
    NotPaid = 0,
    Cash = 1,
    Card = 2,
    UPI = 3,
    Online = 4,
    Split = 5,
    Other = 6
}

public enum AggregatorSource
{
    Direct = 0,
    Zomato = 1,
    Swiggy = 2,
    Magicpin = 3
}

public enum DiscountType
{
    Percentage = 1,
    FixedAmount = 2
}

public enum SubscriptionPlan
{
    Basic = 1,
    Standard = 2,
    Premium = 3,
    Enterprise = 4
}

public enum BusinessType
{
    Cafe = 1,
    Restaurant = 2,
    QSR = 3,
    CloudKitchen = 4,
    Bar = 5
}

