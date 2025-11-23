# UML Class Diagrams - Inglish Backend Models

## 1. User Model

```
┌─────────────────────────────────────┐
│              User                   │
├─────────────────────────────────────┤
│ + id: bigint                        │
│ + email: string                     │
│ + encrypted_password: string        │
│ + name: string                      │
│ + language: string (default: 'en')  │
│ + created_at: datetime              │
│ + updated_at: datetime              │
├─────────────────────────────────────┤
│ + has_many :courses                 │
│ + has_many :reports                 │
│ + has_many :videos                  │
│                                     │
│ + validations:                      │
│   - email: presence, uniqueness     │
│   - name: presence                  │
└─────────────────────────────────────┘
```

**Database Table: `users`**
- id (primary key)
- email (string, unique, indexed)
- encrypted_password (string)
- name (string)
- language (string, default: 'en')
- created_at (datetime)
- updated_at (datetime)

---

## 2. Subject Model

```
┌─────────────────────────────────────┐
│            Subject                  │
├─────────────────────────────────────┤
│ + id: bigint                        │
│ + name: string                      │
│ + description: text                 │
│ + language: string                  │
│ + difficulty: integer (1-3)         │
│ + position: integer                 │
│ + created_at: datetime              │
│ + updated_at: datetime              │
├─────────────────────────────────────┤
│ + belongs_to :course                │
│ + has_many :videos                  │
│                                     │
│ + validations:                      │
│   - name: presence                  │
│   - language: presence              │
│   - difficulty: inclusion (1..3)    │
└─────────────────────────────────────┘
```

**Database Table: `subjects`**
- id (primary key)
- course_id (foreign key, indexed)
- name (string, indexed)
- description (text, nullable)
- language (string)
- difficulty (integer, default: 1)
- position (integer, default: 0)
- created_at (datetime)
- updated_at (datetime)

---

## 3. Course Model

```
┌─────────────────────────────────────┐
│             Course                  │
├─────────────────────────────────────┤
│ + id: bigint                        │
│ + title: string                     │
│ + description: text                 │
│ + language: string                  │
│ + level: string                     │
│ + is_published: boolean (default: false)│
│ + created_at: datetime              │
│ + updated_at: datetime              │
├─────────────────────────────────────┤
│ + belongs_to :user                  │
│ + has_many :subjects                │
│ + has_many :videos (through subjects)│
│                                     │
│ + validations:                      │
│   - title: presence                 │
│   - language: presence              │
│   - user_id: presence               │
└─────────────────────────────────────┘
```

**Database Table: `courses`**
- id (primary key)
- user_id (foreign key, indexed)
- title (string, indexed)
- description (text, nullable)
- language (string)
- level (string, nullable) # beginner, intermediate, advanced
- is_published (boolean, default: false)
- created_at (datetime)
- updated_at (datetime)

---

## 4. Video Model

```
┌─────────────────────────────────────┐
│             Video                   │
├─────────────────────────────────────┤
│ + id: bigint                        │
│ + text: text                        │
│ + language: string                  │
│ + remote_video_url: string          │
│ + local_uri: string                 │
│ + video_type: string (default: 'normal')│
│   # normal, idle, success, retry    │
│ + position: integer (default: 0)    │
│ + did_talk_id: string               │
│ + created_at: datetime              │
│ + updated_at: datetime              │
├─────────────────────────────────────┤
│ + belongs_to :user                  │
│ + belongs_to :subject (optional)    │
│ + has_many :reports                 │
│                                     │
│ + validations:                      │
│   - text: presence                  │
│   - language: presence              │
│   - remote_video_url: presence      │
│   - video_type: inclusion           │
└─────────────────────────────────────┘
```

**Database Table: `videos`**
- id (primary key)
- user_id (foreign key, indexed)
- subject_id (foreign key, nullable, indexed)
- text (text)
- language (string)
- remote_video_url (string)
- local_uri (string, nullable)
- video_type (string, default: 'normal')
- position (integer, default: 0)
- did_talk_id (string, nullable) # D-ID API talk ID
- created_at (datetime)
- updated_at (datetime)

---

## 5. Report Model

```
┌─────────────────────────────────────┐
│             Report                  │
├─────────────────────────────────────┤
│ + id: bigint                        │
│ + accuracy: decimal (0-100)         │
│ + reference_text: text              │
│ + transcribed_text: text            │
│ + incorrect_words: jsonb            │
│ + word_details: jsonb               │
│ + audio_duration: integer (seconds) │
│ + created_at: datetime              │
│ + updated_at: datetime              │
├─────────────────────────────────────┤
│ + belongs_to :user                  │
│ + belongs_to :video                 │
│                                     │
│ + validations:                      │
│   - accuracy: presence, inclusion   │
│   - reference_text: presence        │
│   - video_id: presence              │
└─────────────────────────────────────┘
```

**Database Table: `reports`**
- id (primary key)
- user_id (foreign key, indexed)
- video_id (foreign key, indexed)
- accuracy (decimal, precision: 5, scale: 2) # 0.00 to 100.00
- reference_text (text)
- transcribed_text (text, nullable)
- incorrect_words (jsonb) # Array of incorrect word indices or words
- word_details (jsonb) # Array of word objects with isCorrect, confidence
- audio_duration (integer, nullable) # Duration in seconds
- created_at (datetime)
- updated_at (datetime)

---

## Relationships Diagram

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1
     │
     │ has_many
     │
┌────┴──────────┬──────────────┐
│               │              │
│               │              │
│               │              │
┌──────────┐  ┌───────┐  ┌─────────┐
│ Course   │  │ Video │  │ Report  │
└────┬─────┘  └───┬───┘  └─────────┘
     │            │            │
     │ 1          │ 1          │ 1
     │            │            │
     │ has_many   │ belongs_to │ belongs_to
     │            │            │
┌────┴──────┐     │            │
│ Subject   │     │            │
└─────┬─────┘     │            │
      │           │            │
      │ 1         │            │
      │           │            │
      │ has_many  │            │
      │           │            │
      └───────────┴────────────┘
```

---

## Relationship Summary

1. **User** → **Course** (1:N)
   - A user can create multiple courses
   
2. **User** → **Video** (1:N)
   - A user can create multiple videos
   
3. **User** → **Report** (1:N)
   - A user can have multiple pronunciation reports
   
4. **Course** → **Subject** (1:N)
   - A course contains multiple subjects
   
5. **Subject** → **Video** (1:N, optional)
   - A subject can have multiple videos (videos can exist without subjects)
   
6. **Video** → **Report** (1:N)
   - A video can have multiple pronunciation practice reports

---

## Indexes

1. **users**: email (unique)
2. **courses**: user_id, language
3. **subjects**: course_id, name, language
4. **videos**: user_id, subject_id, video_type, language
5. **reports**: user_id, video_id, created_at

---

## Enums & Constants

### Video Types:
- `normal` - Regular practice video
- `idle` - Background idle loop video
- `success` - Plays on 100% accuracy
- `retry` - Plays when accuracy < 100%

### Difficulty Levels:
- `1` - Easy (Kolay)
- `2` - Medium (Orta)
- `3` - Hard (Zor)

### Languages:
- `en` - English
- `tr` - Turkish




