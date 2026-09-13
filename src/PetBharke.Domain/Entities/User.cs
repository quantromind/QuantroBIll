using MongoDB.Bson.Serialization.Attributes;
using PetBharke.Domain.Common;
using PetBharke.Domain.Enums;

namespace PetBharke.Domain.Entities;

public class User : BaseEntity
{
    [BsonElement("username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("fullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("pin")]
    public string? Pin { get; set; } // 4-digit quick POS switch PIN

    [BsonElement("role")]
    public UserRole Role { get; set; } = UserRole.Cashier;

    [BsonElement("assignedOutletIds")]
    public List<string> AssignedOutletIds { get; set; } = new();

    [BsonElement("permissions")]
    public List<string> Permissions { get; set; } = new();

    [BsonElement("lastLoginAt")]
    public DateTime? LastLoginAt { get; set; }

    [BsonElement("refreshToken")]
    public string? RefreshToken { get; set; }

    [BsonElement("refreshTokenExpiryTime")]
    public DateTime? RefreshTokenExpiryTime { get; set; }

    [BsonElement("mustChangePassword")]
    public bool MustChangePassword { get; set; } = false;
}
