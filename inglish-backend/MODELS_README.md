# Models Documentation

This document describes the database models and their relationships.

## Models Overview

1. **User** - Application users
2. **Course** - Learning courses created by users
3. **Subject** - Subjects/topics within courses
4. **Video** - Practice videos with avatar content
5. **Report** - Pronunciation accuracy reports

## Database Schema

### Users Table
- `id` (bigint, primary key)
- `email` (string, unique, indexed)
- `encrypted_password` (string)
- `name` (string)
- `language` (string, default: 'en')
- `created_at` (datetime)
- `updated_at` (datetime)

### Courses Table
- `id` (bigint, primary key)
- `user_id` (bigint, foreign key, indexed)
- `title` (string, indexed)
- `description` (text, nullable)
- `language` (string)
- `level` (string, nullable) # beginner, intermediate, advanced
- `is_published` (boolean, default: false)
- `created_at` (datetime)
- `updated_at` (datetime)

### Subjects Table
- `id` (bigint, primary key)
- `course_id` (bigint, foreign key, indexed)
- `name` (string, indexed)
- `description` (text, nullable)
- `language` (string)
- `difficulty` (integer, default: 1) # 1=Easy, 2=Medium, 3=Hard
- `position` (integer, default: 0)
- `created_at` (datetime)
- `updated_at` (datetime)

### Videos Table
- `id` (bigint, primary key)
- `user_id` (bigint, foreign key, indexed)
- `subject_id` (bigint, foreign key, nullable, indexed)
- `text` (text)
- `language` (string)
- `remote_video_url` (string)
- `local_uri` (string, nullable)
- `video_type` (string, default: 'normal') # normal, idle, success, retry
- `position` (integer, default: 0)
- `did_talk_id` (string, nullable) # D-ID API talk ID
- `created_at` (datetime)
- `updated_at` (datetime)

### Reports Table
- `id` (bigint, primary key)
- `user_id` (bigint, foreign key, indexed)
- `video_id` (bigint, foreign key, indexed)
- `accuracy` (decimal, precision: 5, scale: 2) # 0.00 to 100.00
- `reference_text` (text)
- `transcribed_text` (text, nullable)
- `incorrect_words` (jsonb, default: [])
- `word_details` (jsonb, default: [])
- `audio_duration` (integer, nullable) # Duration in seconds
- `created_at` (datetime)
- `updated_at` (datetime)

## Relationships

```
User (1) ──── (N) Course
User (1) ──── (N) Video
User (1) ──── (N) Report
Course (1) ──── (N) Subject
Subject (1) ──── (N) Video (optional)
Video (1) ──── (N) Report
```

## Usage Examples

### Creating a User
```ruby
user = User.create!(
  email: 'user@example.com',
  encrypted_password: 'password_hash',
  name: 'John Doe',
  language: 'en'
)
```

### Creating a Course
```ruby
course = user.courses.create!(
  title: 'English Basics',
  description: 'Learn basic English',
  language: 'en',
  level: 'beginner',
  is_published: true
)
```

### Creating a Subject
```ruby
subject = course.subjects.create!(
  name: 'Greetings',
  description: 'Learn how to greet people',
  language: 'en',
  difficulty: 1,
  position: 0
)
```

### Creating a Video
```ruby
video = user.videos.create!(
  text: 'Hello, how are you?',
  language: 'en',
  remote_video_url: 'https://example.com/video.mp4',
  video_type: 'normal',
  position: 0,
  subject: subject
)
```

### Creating a Report
```ruby
report = video.reports.create!(
  user: user,
  accuracy: 85.5,
  reference_text: 'Hello, how are you?',
  transcribed_text: 'Hello, how are you?',
  incorrect_words: [],
  word_details: [
    { word: 'Hello', isCorrect: true, confidence: 0.95 },
    { word: 'how', isCorrect: true, confidence: 0.92 }
  ],
  audio_duration: 3
)
```

## Scopes

### User
- `by_language(lang)` - Filter by language

### Course
- `published` - Only published courses
- `by_language(lang)` - Filter by language
- `by_level(level)` - Filter by level

### Subject
- `by_difficulty(diff)` - Filter by difficulty
- `ordered` - Order by position
- `easy` - Difficulty 1
- `medium` - Difficulty 2
- `hard` - Difficulty 3

### Video
- `by_language(lang)` - Filter by language
- `by_type(type)` - Filter by video type
- `ordered` - Order by position
- `idle_videos` - Idle type videos
- `success_videos` - Success type videos
- `retry_videos` - Retry type videos

### Report
- `perfect` - Accuracy = 100%
- `needs_retry` - Accuracy < 100%
- `recent` - Order by created_at desc
- `by_accuracy_range(min, max)` - Filter by accuracy range

## Validations

All models include appropriate validations:
- Presence validations for required fields
- Uniqueness for email
- Inclusion validations for enums (language, video_type, difficulty, etc.)
- Range validations for numeric fields (accuracy, difficulty)

## Running Migrations

```bash
# Create databases
rails db:create

# Run migrations
rails db:migrate

# Rollback if needed
rails db:rollback
```




