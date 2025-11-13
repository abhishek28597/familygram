# Authentication Flow

## Complete Authentication Process

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    Note over User,Database: Signup Flow
    User->>Frontend: Submit Signup Form
    Frontend->>Backend: POST /api/auth/signup
    Backend->>Backend: Hash Password (bcrypt)
    Backend->>Database: Create User Record
    Database-->>Backend: User Created
    Backend->>Backend: Auto-login: Create JWT Token
    Backend-->>Frontend: Return User + Token
    Frontend->>Frontend: Store Token (localStorage)
    Frontend-->>User: Redirect to Home
    
    Note over User,Database: Login Flow
    User->>Frontend: Submit Login Form
    Frontend->>Backend: POST /api/auth/login
    Backend->>Database: Find User by Username
    Database-->>Backend: Return User
    Backend->>Backend: Verify Password (bcrypt)
    Backend->>Backend: Create JWT Token
    Backend-->>Frontend: Return Token
    Frontend->>Frontend: Store Token (localStorage)
    Frontend-->>User: Redirect to Home
    
    Note over User,Database: Protected Request Flow
    User->>Frontend: Access Protected Page
    Frontend->>Frontend: Get Token from localStorage
    Frontend->>Backend: API Request + Authorization Header
    Backend->>Backend: Extract Token from Header
    Backend->>Backend: Decode & Verify JWT Token
    Backend->>Backend: Extract User ID from Token
    Backend->>Database: Get User by ID
    Database-->>Backend: Return User
    Backend-->>Frontend: Return Data
    Frontend-->>User: Render Content
```

## JWT Token Lifecycle

```mermaid
graph LR
    A[User Login] -->|Username + Password| B[Backend Verifies]
    B -->|Valid| C[Create JWT Token]
    C -->|Contains: user_id, expiration| D[Return Token to Frontend]
    D -->|Store in localStorage| E[Token Stored]
    E -->|Include in Header| F[API Requests]
    F -->|Authorization: Bearer token| G[Backend Validates]
    G -->|Valid| H[Extract User ID]
    G -->|Invalid/Expired| I[401 Unauthorized]
    H -->|Query Database| J[Return User Data]
```

## Password Hashing Process

```mermaid
graph TB
    A[Plain Password] -->|Input| B[bcrypt.hash]
    B -->|Generate Random Salt| C[Salt + Password]
    C -->|Hash with bcrypt| D[Hashed Password]
    D -->|Store in Database| E[Database]
    
    F[Login Password] -->|Input| G[bcrypt.verify]
    G -->|Extract Salt from Stored Hash| H[Use Same Salt]
    H -->|Hash Input Password| I[Compare Hashes]
    I -->|Match| J[Login Success]
    I -->|No Match| K[Login Failed]
```

## Token Structure

```
JWT Token = Header.Payload.Signature

Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "user-uuid-here",
  "exp": 1700000000
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET_KEY
)
```

## Security Features

1. **Password Hashing**: bcrypt with automatic salt generation
2. **Token Expiration**: 30 minutes default (configurable)
3. **Token Signature**: HMAC-SHA256 with secret key
4. **HTTPS Recommended**: For production deployments
5. **No Password Storage**: Only hashed passwords in database

