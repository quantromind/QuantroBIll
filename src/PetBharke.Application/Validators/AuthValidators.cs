using FluentValidation;
using PetBharke.Application.DTOs;

namespace PetBharke.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Identifier).NotEmpty().WithMessage("Username or email is required.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Password is required.");
    }
}

public class RegisterTenantRequestValidator : AbstractValidator<RegisterTenantRequest>
{
    public RegisterTenantRequestValidator()
    {
        RuleFor(x => x.BusinessName).NotEmpty().WithMessage("Business name is required.").MaximumLength(150);
        RuleFor(x => x.OwnerName).NotEmpty().WithMessage("Owner name is required.");
        RuleFor(x => x.OwnerEmail).NotEmpty().EmailAddress().WithMessage("A valid owner email is required.");
        RuleFor(x => x.OwnerPhone).NotEmpty().WithMessage("Owner phone is required.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).WithMessage("Password must be at least 6 characters.");
        RuleFor(x => x.InitialOutletName).NotEmpty().WithMessage("Initial outlet name is required.");
    }
}

public class PinLoginRequestValidator : AbstractValidator<PinLoginRequest>
{
    public PinLoginRequestValidator()
    {
        RuleFor(x => x.OutletId).NotEmpty().WithMessage("Outlet ID is required.");
        RuleFor(x => x.Pin).NotEmpty().Length(4).WithMessage("PIN must be 4 digits.");
    }
}
