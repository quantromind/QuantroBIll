using PetBharke.Application.DTOs;

namespace PetBharke.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> PinLoginAsync(PinLoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterTenantAsync(RegisterTenantRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> SwitchOutletAsync(string userId, SwitchOutletRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task<UserProfileDto> GetProfileAsync(string userId, CancellationToken cancellationToken = default);
}
