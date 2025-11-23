# Relationships & Validations Summary

## ✅ Implemented Relationships

### 1. User Model
```ruby
class User < ApplicationRecord
  has_many :courses, dependent: :destroy
  has_many :videos, dependent: :destroy
  has_many :reports, dependent: :destroy
end
```

### 2. Course Model
```ruby
class Course < ApplicationRecord
  belongs_to :user
  has_many :subjects, dependent: :destroy
  has_many :videos, dependent: :destroy        # ✅ Direct relationship
  has_many :reports, dependent: :destroy       # ✅ Direct relationship
  has_many :subject_videos, through: :subjects, source: :videos
end
```

### 3. Subject Model
```ruby
class Subject < ApplicationRecord
  belongs_to :course
  has_many :videos, dependent: :destroy
end
```

### 4. Video Model
```ruby
class Video < ApplicationRecord
  belongs_to :user
  belongs_to :course                           # ✅ Added
  belongs_to :subject, optional: true
  has_many :reports, dependent: :destroy
end
```

### 5. Report Model
```ruby
class Report < ApplicationRecord
  belongs_to :user
  belongs_to :video
  belongs_to :course                           # ✅ Added
end
```

---

## ✅ Relationships Diagram

```
User (1) ──────────── (N) Course
  │                      │
  │                      ├── (N) Subject
  │                      ├── (N) Video ────── (N) Report
  │                      └── (N) Report
  │
  ├── (N) Video
  └── (N) Report
```

**Relationships Summary:**
1. ✅ User `has_many` :courses
2. ✅ Course `belongs_to` :user
3. ✅ Course `has_many` :videos (direct)
4. ✅ Course `has_many` :reports (direct)
5. ✅ Course `has_many` :subjects

---

## ✅ Validations on All Models

### User Model Validations
```ruby
validates :email, presence: true, uniqueness: { case_sensitive: false }
validates :name, presence: true
validates :language, presence: true, inclusion: { in: %w[en tr] }
validates :encrypted_password, presence: true
```

### Course Model Validations
```ruby
validates :title, presence: true
validates :language, presence: true, inclusion: { in: %w[en tr] }
validates :user_id, presence: true
validates :level, inclusion: { in: %w[beginner intermediate advanced] }, allow_nil: true
```

### Subject Model Validations
```ruby
validates :name, presence: true
validates :language, presence: true, inclusion: { in: %w[en tr] }
validates :difficulty, inclusion: { in: 1..3 }
validates :course_id, presence: true
```

### Video Model Validations
```ruby
validates :text, presence: true
validates :language, presence: true, inclusion: { in: %w[en tr] }
validates :remote_video_url, presence: true
validates :video_type, inclusion: { in: %w[normal idle success retry] }
validates :user_id, presence: true
validates :course_id, presence: true
```

### Report Model Validations
```ruby
validates :accuracy, presence: true, inclusion: { in: 0.0..100.0 }
validates :reference_text, presence: true
validates :user_id, presence: true
validates :video_id, presence: true
validates :course_id, presence: true
```

---

## 📊 Database Schema Changes

### Videos Table
- ✅ Added `course_id` (foreign key, required, indexed)
- ✅ Added index on `[:course_id, :language]`

### Reports Table
- ✅ Added `course_id` (foreign key, required, indexed)
- ✅ Added index on `[:course_id, :created_at]`

---

## 🔍 Usage Examples

### Creating a Course with Videos
```ruby
user = User.find(1)
course = user.courses.create!(
  title: 'English Basics',
  language: 'en',
  level: 'beginner'
)

# Video belongs to both user and course
video = course.videos.create!(
  user: user,
  text: 'Hello, how are you?',
  language: 'en',
  remote_video_url: 'https://example.com/video.mp4'
)
```

### Creating a Report
```ruby
# Report belongs to user, video, and course
report = course.reports.create!(
  user: user,
  video: video,
  accuracy: 85.5,
  reference_text: 'Hello, how are you?'
)
```

### Accessing Course's Videos and Reports
```ruby
course = Course.find(1)

# Get all videos in this course
course.videos

# Get all reports for this course
course.reports

# Get videos through subjects
course.subject_videos
```

---

## ✅ Verification Checklist

- [x] User has_many :courses
- [x] Course belongs_to :user
- [x] Course has_many :videos
- [x] Course has_many :reports
- [x] Course has_many :subjects
- [x] Video belongs_to :course
- [x] Report belongs_to :course
- [x] All models have validations
- [x] Database migrations updated
- [x] Foreign keys and indexes added

---

## 📝 Next Steps

1. **Run migrations:**
   ```bash
   rails db:migrate
   ```

2. **Test relationships:**
   ```bash
   rails console
   ```

3. **Verify validations:**
   ```ruby
   # In Rails console
   user = User.new(email: nil)
   user.valid? # Should return false
   user.errors.full_messages
   ```




