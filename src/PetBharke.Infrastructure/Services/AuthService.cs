using MongoDB.Driver;
using PetBharke.Application.DTOs;
using PetBharke.Application.Exceptions;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IMongoDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IPinRateLimiter _pinRateLimiter;

    public AuthService(
        IMongoDbContext context,
        IPasswordHasher passwordHasher,
        IJwtService jwtService,
        IPinRateLimiter pinRateLimiter)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _pinRateLimiter = pinRateLimiter;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var identifier = request.Identifier.Trim().ToLower();
        var cleanIdentifier = identifier
            .Replace("@gmamil.com", "@gmail.com")
            .Replace("@gmaill.com", "@gmail.com")
            .Replace("@gmai.com", "@gmail.com")
            .Replace("@gmal.com", "@gmail.com");

        var isSuperAdminAlias = identifier == "admin@quantromind.com" || 
                                cleanIdentifier == "admin@quantromind.com" ||
                                identifier == "superadmin";

        var user = await _context.Users
            .Find(u => (u.Email.ToLower() == identifier || 
                        u.Email.ToLower() == cleanIdentifier || 
                        u.Username.ToLower() == identifier ||
                        u.Username.ToLower() == cleanIdentifier ||
                        (isSuperAdminAlias && u.Role == UserRole.SuperAdmin)) && u.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedException("Invalid username/email or password.");
        }

        // Verify password
        bool isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);

        if (!isPasswordValid)
        {
            throw new UnauthorizedException("Invalid username/email or password.");
        }

        return await GenerateAuthResponseForUserAsync(user, request.OutletId, cancellationToken);
    }

    public async Task<AuthResponse> PinLoginAsync(PinLoginRequest request, CancellationToken cancellationToken = default)
    {
        if (_pinRateLimiter.IsLocked(request.OutletId, out var remaining))
        {
            var mins = Math.Ceiling(remaining.TotalMinutes);
            throw new AppException($"Too many failed PIN attempts. Outlet is locked for {mins} minute(s).", 429);
        }

        var outlet = await _context.Outlets
            .Find(o => o.Id == request.OutletId && o.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (outlet == null)
        {
            throw new NotFoundException(nameof(Outlet), request.OutletId);
        }

        var user = await _context.Users
            .Find(u => u.Pin == request.Pin && u.TenantId == outlet.TenantId && u.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            _pinRateLimiter.RecordFailure(request.OutletId);
            throw new UnauthorizedException("Invalid PIN code.");
        }

        _pinRateLimiter.RecordSuccess(request.OutletId);
        return await GenerateAuthResponseForUserAsync(user, outlet.Id, cancellationToken);
    }

    public async Task<OutletResolutionDto> ResolveOutletAsync(string code, CancellationToken cancellationToken = default)
    {
        var cleanCode = code?.Trim();
        if (string.IsNullOrWhiteSpace(cleanCode))
        {
            throw new AppException("Outlet code is required.", 400);
        }

        Outlet? outlet = null;
        if (MongoDB.Bson.ObjectId.TryParse(cleanCode, out _))
        {
            outlet = await _context.Outlets
                .Find(o => (o.Id == cleanCode || o.Code.ToLower() == cleanCode.ToLower()) && o.IsActive)
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            outlet = await _context.Outlets
                .Find(o => o.Code.ToLower() == cleanCode.ToLower() && o.IsActive)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (outlet == null)
        {
            throw new NotFoundException(nameof(Outlet), cleanCode);
        }

        var tenant = await _context.Tenants
            .Find(t => t.Id == outlet.TenantId && t.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        return new OutletResolutionDto
        {
            OutletId = outlet.Id,
            TenantId = outlet.TenantId,
            OutletName = outlet.Name,
            TenantName = tenant?.BusinessName ?? outlet.Name,
            Code = outlet.Code
        };
    }

    public async Task<AuthResponse> RegisterTenantAsync(RegisterTenantRequest request, CancellationToken cancellationToken = default)
    {
        // Check if email already registered
        var existingUser = await _context.Users
            .Find(u => u.Email.ToLower() == request.OwnerEmail.ToLower())
            .FirstOrDefaultAsync(cancellationToken);

        if (existingUser != null)
        {
            throw new AppException("An account with this email already exists.");
        }

        // 1. Create Tenant
        var tenant = new Tenant
        {
            BusinessName = request.BusinessName,
            OwnerEmail = request.OwnerEmail.ToLower(),
            OwnerPhone = request.OwnerPhone,
            SubscriptionPlan = SubscriptionPlan.Standard,
            SubscriptionExpiresAt = DateTime.UtcNow.AddYears(1),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.Tenants.InsertOneAsync(tenant, cancellationToken: cancellationToken);

        // 2. Create Initial Outlet
        var outlet = new Outlet
        {
            TenantId = tenant.Id,
            Name = request.InitialOutletName,
            Code = "R" + new Random().Next(100000, 999999),
            Address = request.InitialOutletAddress,
            Phone = request.OwnerPhone,
            GSTIN = request.GSTIN ?? string.Empty,
            Currency = "INR",
            TaxSettings = new OutletTaxSettings
            {
                CgstPercentage = 2.5m,
                SgstPercentage = 2.5m,
                IsGstInclusive = false
            },
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.Outlets.InsertOneAsync(outlet, cancellationToken: cancellationToken);

        // 3. Create Admin User
        var user = new User
        {
            TenantId = tenant.Id,
            OutletId = outlet.Id,
            Username = request.OwnerEmail.Split('@')[0],
            Email = request.OwnerEmail.ToLower(),
            FullName = request.OwnerName,
            Phone = request.OwnerPhone,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Role = UserRole.Owner,
            AssignedOutletIds = new List<string> { outlet.Id },
            Permissions = new List<string> { "all" },
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.Users.InsertOneAsync(user, cancellationToken: cancellationToken);

        return await GenerateAuthResponseForUserAsync(user, outlet.Id, cancellationToken);
    }

    public async Task<AuthResponse> SwitchOutletAsync(string userId, SwitchOutletRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Find(u => u.Id == userId && u.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            throw new NotFoundException(nameof(User), userId);
        }

        if (user.Role != UserRole.SuperAdmin && user.Role != UserRole.Owner && !user.AssignedOutletIds.Contains(request.OutletId))
        {
            throw new ForbiddenException("You do not have access to switch to this outlet.");
        }

        return await GenerateAuthResponseForUserAsync(user, request.OutletId, cancellationToken);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Find(u => u.RefreshToken == request.RefreshToken && u.RefreshTokenExpiryTime > DateTime.UtcNow && u.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        return await GenerateAuthResponseForUserAsync(user, user.OutletId, cancellationToken);
    }

    public async Task<UserProfileDto> GetProfileAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Find(u => u.Id == userId && u.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (user == null)
        {
            throw new NotFoundException(nameof(User), userId);
        }

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            Permissions = user.Permissions,
            TenantId = user.TenantId,
            MustChangePassword = user.MustChangePassword
        };
    }

    private async Task<AuthResponse> GenerateAuthResponseForUserAsync(User user, string? selectedOutletId, CancellationToken cancellationToken)
    {
        Tenant? tenant = null;
        if (!string.IsNullOrEmpty(user.TenantId))
        {
            tenant = await _context.Tenants
                .Find(t => t.Id == user.TenantId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        List<Outlet> availableOutlets = new();
        if (!string.IsNullOrEmpty(user.TenantId))
        {
            availableOutlets = await _context.Outlets
                .Find(o => o.TenantId == user.TenantId && o.IsActive)
                .ToListAsync(cancellationToken);
        }

        Outlet? activeOutlet = null;
        if (!string.IsNullOrEmpty(selectedOutletId))
        {
            activeOutlet = availableOutlets.FirstOrDefault(o => o.Id == selectedOutletId);
        }

        activeOutlet ??= availableOutlets.FirstOrDefault();

        // Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(
            user,
            user.TenantId,
            activeOutlet?.Id,
            activeOutlet?.Name,
            tenant?.BusinessName
        );

        var refreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;

        await _context.Users.UpdateOneAsync(
            u => u.Id == user.Id,
            Builders<User>.Update
                .Set(u => u.RefreshToken, refreshToken)
                .Set(u => u.RefreshTokenExpiryTime, user.RefreshTokenExpiryTime)
                .Set(u => u.LastLoginAt, user.LastLoginAt),
            cancellationToken: cancellationToken);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(12),
            MustChangePassword = user.MustChangePassword,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                Permissions = user.Permissions,
                TenantId = user.TenantId,
                MustChangePassword = user.MustChangePassword
            },
            Tenant = tenant != null ? new TenantSummaryDto
            {
                Id = tenant.Id,
                BusinessName = tenant.BusinessName,
                SubscriptionPlan = tenant.SubscriptionPlan.ToString()
            } : null,
            ActiveOutlet = activeOutlet != null ? new OutletSummaryDto
            {
                Id = activeOutlet.Id,
                Name = activeOutlet.Name,
                Code = activeOutlet.Code,
                Address = activeOutlet.Address,
                Phone = activeOutlet.Phone,
                Currency = activeOutlet.Currency,
                CgstPercentage = activeOutlet.TaxSettings?.CgstPercentage ?? 2.5m,
                SgstPercentage = activeOutlet.TaxSettings?.SgstPercentage ?? 2.5m
            } : null,
            AvailableOutlets = availableOutlets.Select(o => new OutletSummaryDto
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                Address = o.Address,
                Phone = o.Phone,
                Currency = o.Currency,
                CgstPercentage = o.TaxSettings?.CgstPercentage ?? 2.5m,
                SgstPercentage = o.TaxSettings?.SgstPercentage ?? 2.5m
            }).ToList()
        };
    }
}
