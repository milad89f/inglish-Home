# API Endpoints Documentation (v1)

## Base URL
```
/api/v1
```

## Authentication

Currently, the API uses basic authentication. Future versions may implement JWT tokens.

---

## Endpoints

### User Endpoints

#### 1. Sign Up
**POST** `/api/v1/users/signup`

Create a new user account.

**Request Body:**
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

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "language": "en",
    "created_at": "2025-01-19T12:00:00Z",
    "updated_at": "2025-01-19T12:00:00Z"
  }
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "success": false,
  "message": "Failed to create user",
  "errors": {
    "email": ["has already been taken"],
    "password": ["is too short (minimum is 6 characters)"]
  }
}
```

---

#### 2. Login
**POST** `/api/v1/users/login`

Authenticate a user.

**Request Body:**
```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "language": "en",
    "created_at": "2025-01-19T12:00:00Z",
    "updated_at": "2025-01-19T12:00:00Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

#### 3. Get User Courses
**GET** `/api/v1/users/:id/courses`

Get all courses for a specific user.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "English Basics",
      "description": "Learn basic English",
      "language": "en",
      "level": "beginner",
      "is_published": true,
      "user_id": 1,
      "created_at": "2025-01-19T12:00:00Z",
      "updated_at": "2025-01-19T12:00:00Z"
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### Course Endpoints

#### 4. Create Course
**POST** `/api/v1/courses`

Create a new course.

**Request Body:**
```json
{
  "course": {
    "title": "English Basics",
    "description": "Learn basic English",
    "language": "en",
    "level": "beginner",
    "is_published": false,
    "user_id": 1
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": 1,
    "title": "English Basics",
    "description": "Learn basic English",
    "language": "en",
    "level": "beginner",
    "is_published": false,
    "user_id": 1,
    "created_at": "2025-01-19T12:00:00Z",
    "updated_at": "2025-01-19T12:00:00Z"
  }
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "success": false,
  "message": "Failed to create course",
  "errors": {
    "title": ["can't be blank"],
    "user_id": ["must exist"]
  }
}
```

---

#### 5. Get Course
**GET** `/api/v1/courses/:id`

Get a specific course with user and subjects.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "English Basics",
    "description": "Learn basic English",
    "language": "en",
    "level": "beginner",
    "is_published": true,
    "user_id": 1,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "language": "en"
    },
    "subjects": [
      {
        "id": 1,
        "name": "Greetings",
        "description": "Learn how to greet people",
        "language": "en",
        "difficulty": 1,
        "difficulty_label": "Easy",
        "position": 0
      }
    ],
    "created_at": "2025-01-19T12:00:00Z",
    "updated_at": "2025-01-19T12:00:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Course not found"
}
```

---

#### 6. Get Course Videos
**GET** `/api/v1/courses/:id/videos`

Get all videos for a specific course.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "text": "Hello, how are you?",
      "language": "en",
      "remote_video_url": "https://example.com/video.mp4",
      "local_uri": null,
      "video_type": "normal",
      "position": 0,
      "did_talk_id": "talk_123",
      "user_id": 1,
      "course_id": 1,
      "subject_id": 1,
      "is_idle": false,
      "is_success": false,
      "is_retry": false,
      "created_at": "2025-01-19T12:00:00Z",
      "updated_at": "2025-01-19T12:00:00Z"
    }
  ]
}
```

---

#### 7. Get Course Reports
**GET** `/api/v1/courses/:id/reports`

Get all reports for a specific course.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "accuracy": 85.5,
      "reference_text": "Hello, how are you?",
      "transcribed_text": "Hello, how are you?",
      "incorrect_words": [],
      "word_details": [
        {
          "word": "Hello",
          "isCorrect": true,
          "confidence": 0.95
        }
      ],
      "audio_duration": 3,
      "accuracy_level": "good",
      "perfect": false,
      "good": true,
      "needs_practice": false,
      "user_id": 1,
      "video_id": 1,
      "course_id": 1,
      "created_at": "2025-01-19T12:00:00Z",
      "updated_at": "2025-01-19T12:00:00Z"
    }
  ]
}
```

---

#### 8. Get Course Subjects
**GET** `/api/v1/courses/:id/subjects`

Get all subjects for a specific course.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Greetings",
      "description": "Learn how to greet people",
      "language": "en",
      "difficulty": 1,
      "difficulty_label": "Easy",
      "position": 0,
      "created_at": "2025-01-19T12:00:00Z",
      "updated_at": "2025-01-19T12:00:00Z"
    }
  ]
}
```

---

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["error message"]
  }
}
```

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication failed
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

---

## Validation Rules

### User
- `email`: Required, unique, valid email format
- `password`: Required, minimum 6 characters
- `name`: Required
- `language`: Required, must be 'en' or 'tr'

### Course
- `title`: Required
- `language`: Required, must be 'en' or 'tr'
- `user_id`: Required, must exist
- `level`: Optional, must be 'beginner', 'intermediate', or 'advanced'
- `is_published`: Boolean, default false

---

## Example cURL Requests

### Sign Up
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

### Login
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

### Create Course
```bash
curl -X POST http://localhost:3000/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{
    "course": {
      "title": "English Basics",
      "description": "Learn basic English",
      "language": "en",
      "level": "beginner",
      "user_id": 1
    }
  }'
```

### Get Course
```bash
curl -X GET http://localhost:3000/api/v1/courses/1 \
  -H "Content-Type: application/json"
```




