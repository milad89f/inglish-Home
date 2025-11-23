# إعداد المشروع على Windows

## المشاكل الشائعة والحلول

### المشكلة 1: psych gem
**الخطأ:** `yaml.h not found`

**الحل:**
1. تثبيت MSYS2 من: https://www.msys2.org/
2. فتح MSYS2 terminal
3. تشغيل:
   ```bash
   pacman -S mingw-w64-x86_64-libyaml
   ```

### المشكلة 2: pg gem (PostgreSQL)
**الخطأ:** `Can't find the 'libpq-fe.h header`

**الحلول:**

#### الحل 1: تثبيت PostgreSQL Client
1. تثبيت PostgreSQL من: https://www.postgresql.org/download/windows/
2. إضافة PostgreSQL bin إلى PATH

#### الحل 2: استخدام SQLite مؤقتاً (للاختبار فقط)
استبدل في `Gemfile`:
```ruby
# gem "pg", "~> 1.1"
gem "sqlite3", "~> 1.4"
```

وفي `config/database.yml`:
```yaml
development:
  adapter: sqlite3
  database: db/development.sqlite3
```

## الحل السريع (للاختبار)

إذا كنت تريد اختبار المشروع فقط بدون PostgreSQL:

1. استخدم SQLite بدلاً من PostgreSQL
2. تخطي gems التطوير (rswag) مؤقتاً
3. استخدم psych الموجود مع Ruby

## خطوات التشغيل بعد حل المشاكل

```powershell
cd inglish-backend
bundle install
rails db:create
rails db:migrate
rails server
```

