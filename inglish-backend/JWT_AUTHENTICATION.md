# JWT Authentication Documentation

## Overview

The API uses JWT (JSON Web Tokens) for authentication. All course-related endpoints are protected and require a valid JWT token.

## Authentication Flow

1. **Sign Up/Login** - User receives a JWT token
2. **Protected Requests** - Include token in Authorization header
3. **Token Validation** - Server validates token and sets current_user
4. **Resource Access** - Users can only access their own resources

---

## Token Format

### Token Structure
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDY1NzYwMDB9.signature
```

### Token Payload
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "iat": 1706576000,
  "exp": 1706662400
}
```

### Token Expiration
- **Default**: 24 hours from issue time
- **Expires At**: Included in login/signup response

---

## Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Sign Up
**POST** `/api/v1/users/signup`

**Request:**
```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "name": "John Doe",
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "language": "en"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2025-01-20T12:00:00Z"
  }
}
```

---

#### 2. Login
**POST** `/api/v1/users/login`

**Request:**
```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "language": "en"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2025-01-20T12:00:00Z"
  }
}
```

---

#### 3. Verify Token
**GET** `/api/v1/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Authenticated",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "language": "en"
    }
  }
}
```

---

### Protected Endpoints (Authentication Required)

All course-related endpoints require a valid JWT token in the Authorization header.

#### Authorization Header Format
```
Authorization: Bearer <token>
```

Or:
```
Authorization: <token>
```

---

## Protected Endpoints

### 1. Get User Courses
**GET** `/api/v1/users/:id/courses`

**Headers:**
```
Authorization: Bearer <token>
```

**Notes:**
- Users can only access their own courses
- Returns 403 Forbidden if trying to access another user's courses

---

### 2. Create Course
**POST** `/api/v1/courses`

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "course": {
    "title": "English Basics",
    "description": "Learn basic English",
    "language": "en",
    "level": "beginner"
  }
}
```

**Notes:**
- Course is automatically assigned to authenticated user
- user_id from token is used, not from request body

---

### 3. Get Course
**GET** `/api/v1/courses/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Notes:**
- Users can only access their own courses

---

### 4. Get Course Videos
**GET** `/api/v1/courses/:id/videos`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 5. Get Course Reports
**GET** `/api/v1/courses/:id/reports`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 6. Get Course Subjects
**GET** `/api/v1/courses/:id/subjects`

**Headers:**
```
Authorization: Bearer <token>
```

---

## Error Responses

### 401 Unauthorized
**Missing or Invalid Token**
```json
{
  "success": false,
  "message": "Unauthorized. Invalid or missing token."
}
```

### 403 Forbidden
**Accessing Another User's Resource**
```json
{
  "success": false,
  "message": "Unauthorized. You can only access your own courses."
}
```

### 401 Unauthorized
**Invalid Credentials**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Implementation Details

### JWT Service
Location: `app/services/jwt_service.rb`

**Methods:**
- `JwtService.token_for(user)` - Generate token for user
- `JwtService.current_user(token)` - Get user from token
- `JwtService.encode(payload)` - Encode payload to token
- `JwtService.decode(token)` - Decode token to payload

### Authentication Middleware
Location: `app/controllers/concerns/authenticable.rb`

**Features:**
- Extracts token from Authorization header
- Validates token and sets current_user
- Automatically included in BaseController

### Protected Controllers
- All controllers inheriting from `Api::V1::BaseController` are protected
- Skip authentication: `skip_before_action :authenticate_user!, only: [:signup, :login]`

---

## Security Features

1. **Token Expiration**: Tokens expire after 24 hours
2. **User Isolation**: Users can only access their own resources
3. **Password Hashing**: Using bcrypt for password security
4. **Token Validation**: All tokens are validated on each request
5. **Secure Secret**: Using Rails secret_key_base for token signing

---

## Usage Examples

### cURL - Sign Up
```bash
curl -X POST http://localhost:3000/api/v1/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "user@example.com",
      "password": "password123",
      "password_confirmation": "password123",
      "name": "John Doe",
      "language": "en"
    }
  }'
```

### cURL - Login
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "user@example.com",
      "password": "password123"
    }
  }'
```

### cURL - Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/v1/courses/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### JavaScript/Fetch - Protected Endpoint
```javascript
fetch('http://localhost:3000/api/v1/courses', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Token Storage Recommendations

### Frontend Storage Options:

1. **localStorage** (Not recommended for sensitive apps)
   ```javascript
   localStorage.setItem('token', token);
   ```

2. **sessionStorage** (Better for single session)
   ```javascript
   sessionStorage.setItem('token', token);
   ```

3. **Memory/State** (Most secure, lost on refresh)
   ```javascript
   // React/Redux state
   dispatch(setAuthToken(token));
   ```

4. **HttpOnly Cookies** (Best for web apps, requires additional setup)

---

## Token Refresh

Currently, tokens are valid for 24 hours. To refresh:

1. User must login again to get a new token
2. Future enhancement: Implement refresh token mechanism

---

## Testing Authentication

### Rails Console
```ruby
# Generate token for user
user = User.first
token = JwtService.token_for(user)

# Verify token
JwtService.current_user(token)
```

### RSpec Example
```ruby
describe "Courses API" do
  let(:user) { create(:user) }
  let(:token) { JwtService.token_for(user) }
  
  it "requires authentication" do
    get "/api/v1/courses", headers: { "Authorization" => "Bearer #{token}" }
    expect(response).to have_http_status(:success)
  end
end
```




