# Postman Collection Setup Guide

## Overview

This guide explains how to import and use the Inglish Backend API Postman Collection.

## File Location

The Postman collection is located at:
```
Inglish_Backend_API.postman_collection.json
```

## Importing the Collection

### Method 1: Import from File
1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Click **Choose Files**
5. Navigate to project root and select `Inglish_Backend_API.postman_collection.json`
6. Click **Import**

### Method 2: Import from Link (if hosted)
1. Open Postman
2. Click **Import** button
3. Select **Link** tab
4. Paste the collection URL
5. Click **Import**

---

## Setting Up Environment Variables

### Create Environment

1. In Postman, click **Environments** (left sidebar)
2. Click **+** to create new environment
3. Name it: `Inglish Backend Local` or `Inglish Backend Development`

### Configure Variables

Add the following variables:

| Variable | Initial Value | Current Value | Description |
|----------|---------------|---------------|-------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` | API base URL |
| `auth_token` | (empty) | (empty) | JWT token (auto-filled after login) |

**Note:** The collection also has collection-level variables that work as defaults.

---

## Using the Collection

### Step 1: Start the Rails Server

```bash
cd inglish-backend
rails server
```

Server will start at `http://localhost:3000`

### Step 2: Select Environment

1. In Postman, select the environment from the dropdown (top right)
2. Choose `Inglish Backend Local` (or your environment name)

### Step 3: Test Health Endpoint (Optional)

1. Open **Health** → **Health Check**
2. Click **Send**
3. Should return `200 OK` with health status

### Step 4: Sign Up or Login

**Option A: Sign Up (Create New User)**
1. Open **Authentication** → **Sign Up**
2. Review the request body (can modify email, name, etc.)
3. Click **Send**
4. Copy the `token` from response

**Option B: Login (Existing User)**
1. Open **Authentication** → **Login**
2. Review the request body (update email/password if needed)
3. Click **Send**
4. **Token is automatically saved!** (see Test Script section)

### Step 5: Use Protected Endpoints

After login, the token is automatically saved. All protected endpoints will use it automatically.

1. Open any endpoint under **Users** or **Courses**
2. Click **Send**
3. Token is automatically included in Authorization header

---

## Automatic Token Management

The **Login** endpoint includes a test script that automatically saves the JWT token to the environment variable.

**Script:**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        pm.environment.set("auth_token", jsonData.data.token);
        console.log("Token saved to environment");
    }
}
```

After successful login:
- Token is saved to `auth_token` variable
- All subsequent requests use this token automatically
- No manual token copy/paste needed

---

## Collection Structure

```
Inglish Backend API - v1
├── Authentication (Public)
│   ├── Sign Up
│   ├── Login (auto-saves token)
│   └── Verify Token (Me)
├── Health (Public)
│   └── Health Check
├── Users (Protected)
│   └── Get User Courses
└── Courses (Protected)
    ├── Create Course
    ├── Get Course
    ├── Get Course Videos
    ├── Get Course Reports
    └── Get Course Subjects
```

---

## Endpoint Details

### Public Endpoints (No Token Required)

1. **POST /api/v1/users/signup** - Create new user
2. **POST /api/v1/users/login** - Authenticate user (auto-saves token)
3. **GET /api/v1/health** - Check API health
4. **GET /api/v1/auth/me** - Verify token (requires token)

### Protected Endpoints (Token Required)

1. **GET /api/v1/users/:id/courses** - Get user's courses
2. **POST /api/v1/courses** - Create course
3. **GET /api/v1/courses/:id** - Get course details
4. **GET /api/v1/courses/:id/videos** - Get course videos
5. **GET /api/v1/courses/:id/reports** - Get course reports
6. **GET /api/v1/courses/:id/subjects** - Get course subjects

---

## Updating Variables in Requests

### Change Base URL

1. Update environment variable `base_url`
2. Or update collection-level variable
3. All requests will automatically use new URL

### Update Course/User IDs

In protected endpoints, you can modify the `:id` variable:
- Click on the request
- Go to **Params** or **Variables** tab
- Update the `id` value

Example: Change `:id` from `1` to `5` in **Get Course**

---

## Testing Workflow

### Complete Testing Flow:

1. **Health Check** → Verify API is running
2. **Sign Up** → Create test user (or use existing)
3. **Login** → Get token (auto-saved)
4. **Verify Token** → Confirm authentication works
5. **Create Course** → Create a test course
6. **Get Course** → Retrieve created course
7. **Get User Courses** → List all user's courses
8. **Get Course Videos/Reports/Subjects** → Test nested resources

---

## Troubleshooting

### Token Not Saved

**Problem:** Token not automatically saved after login

**Solution:**
1. Check Test Script is enabled in Login request
2. Manually copy token from response
3. Update `auth_token` environment variable
4. Or add token directly to Authorization header

### 401 Unauthorized

**Problem:** Getting 401 Unauthorized on protected endpoints

**Solutions:**
1. Verify token exists in environment: `{{auth_token}}`
2. Login again to get fresh token
3. Check token hasn't expired (24 hours)
4. Verify Authorization header format: `Bearer <token>`

### 403 Forbidden

**Problem:** Getting 403 Forbidden on user/course endpoints

**Solution:**
- Users can only access their own resources
- Ensure you're using the correct user_id
- Create resources with your own authenticated user

### Connection Refused

**Problem:** Can't connect to API

**Solutions:**
1. Verify Rails server is running: `rails server`
2. Check base_url is correct: `http://localhost:3000`
3. Try accessing health endpoint first
4. Check firewall/network settings

---

## Environment-Specific URLs

### Local Development
```
base_url: http://localhost:3000
```

### Development Server
```
base_url: http://your-dev-server.com
```

### Staging
```
base_url: https://staging.inglish-backend.com
```

### Production
```
base_url: https://api.inglish-backend.com
```

---

## Additional Tips

1. **Save Responses**: Right-click response → Save Response → Save as example
2. **Organize Folders**: Create folders for different scenarios
3. **Use Pre-request Scripts**: Add scripts to set variables dynamically
4. **Export Collection**: Keep backup of collection JSON
5. **Share Collection**: Export and share with team members

---

## Collection Variables

The collection includes these default variables:

| Variable | Default Value | Purpose |
|----------|---------------|---------|
| `base_url` | `http://localhost:3000` | API base URL |
| `auth_token` | (empty) | JWT authentication token |

These can be overridden by environment variables.

---

## Next Steps

1. Import the collection
2. Set up environment
3. Start Rails server
4. Test authentication flow
5. Explore all endpoints
6. Customize requests for your needs

Happy testing! 🚀




