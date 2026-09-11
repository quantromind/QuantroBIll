FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY PetBharke.sln ./
COPY src/PetBharke.Domain/*.csproj ./src/PetBharke.Domain/
COPY src/PetBharke.Application/*.csproj ./src/PetBharke.Application/
COPY src/PetBharke.Infrastructure/*.csproj ./src/PetBharke.Infrastructure/
COPY src/PetBharke.API/*.csproj ./src/PetBharke.API/

RUN dotnet restore PetBharke.sln

COPY . ./
RUN dotnet publish src/PetBharke.API/PetBharke.API.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /out ./
EXPOSE 8080
ENTRYPOINT ["dotnet", "PetBharke.API.dll"]
