using MongoDB.Bson.Serialization.Attributes;
using PetBharke.Domain.Common;

namespace PetBharke.Domain.Entities;

public class Category : BaseEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("displayOrder")]
    public int DisplayOrder { get; set; } = 0;

    [BsonElement("iconUrl")]
    public string? IconUrl { get; set; }

    [BsonElement("colorCode")]
    public string? ColorCode { get; set; }
}

public class MenuItem : BaseEntity
{
    [BsonElement("categoryId")]
    public string CategoryId { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("shortCode")]
    public string ShortCode { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("basePrice")]
    public decimal BasePrice { get; set; }

    [BsonElement("isVeg")]
    public bool IsVeg { get; set; } = true;

    [BsonElement("isAvailable")]
    public bool IsAvailable { get; set; } = true; // Item On/Off switch

    [BsonElement("imageUrl")]
    public string? ImageUrl { get; set; }

    [BsonElement("variants")]
    public List<MenuItemVariant> Variants { get; set; } = new();

    [BsonElement("addOnGroups")]
    public List<AddOnGroup> AddOnGroups { get; set; } = new();

    [BsonElement("taxRatePercentage")]
    public decimal TaxRatePercentage { get; set; } = 5.0m; // standard 5% GST
}

public class MenuItemVariant
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty; // e.g. "Regular", "Large", "500ml"

    [BsonElement("price")]
    public decimal Price { get; set; }

    [BsonElement("isDefault")]
    public bool IsDefault { get; set; } = false;
}

public class AddOnGroup
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty; // e.g. "Choose Toppings", "Extra Cheese"

    [BsonElement("minSelection")]
    public int MinSelection { get; set; } = 0;

    [BsonElement("maxSelection")]
    public int MaxSelection { get; set; } = 1;

    [BsonElement("options")]
    public List<AddOnOption> Options { get; set; } = new();
}

public class AddOnOption
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("price")]
    public decimal Price { get; set; }
}
