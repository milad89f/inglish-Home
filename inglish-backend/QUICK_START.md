# دليل التشغيل السريع - Inglish Backend

## ⚠️ المشكلة الحالية

المشروع يحتاج إلى gems تحتاج native extensions على Windows:
- `psych` gem (يحتاج libyaml)
- `pg` gem (يحتاج PostgreSQL client) - تم استبداله بـ SQLite

## ✅ الحلول المتاحة

### الحل 1: تثبيت MSYS2 (موصى به - الأفضل)

1. **حمّل MSYS2:**
   - من: https://www.msys2.org/
   - شغّل installer

2. **افتح MSYS2 terminal** (ليس PowerShell)

3. **ثبت libyaml:**
   ```bash
   pacman -Syu
   pacman -S mingw-w64-x86_64-libyaml
   ```

4. **من PowerShell، شغّل:**
   ```powershell
   cd inglish-backend
   bundle install
   rails db:create
   rails db:migrate
   rails server
   ```

### الحل 2: استخدام Docker (أسهل)

إذا كان Docker مثبتاً:

```powershell
cd inglish-backend
docker-compose up
```

(يحتاج ملف docker-compose.yml)

### الحل 3: استخدام RubyInstaller DevKit

1. حمّل من: https://rubyinstaller.org/downloads/
2. شغّل installer
3. ثم `bundle install`

## 📋 الخطوات بعد حل مشكلة psych

```powershell
# 1. الانتقال إلى مجلد المشروع
cd inglish-backend

# 2. تثبيت gems
bundle install

# 3. إنشاء قاعدة البيانات
rails db:create

# 4. تشغيل migrations
rails db:migrate

# 5. تشغيل الخادم
rails server
```

## 🧪 اختبار المشروع

بعد تشغيل الخادم:

1. **فحص Health:**
   ```powershell
   curl http://localhost:3000/api/v1/health
   ```

2. **تسجيل مستخدم جديد:**
   ```powershell
   curl -X POST http://localhost:3000/api/v1/users/signup `
     -H "Content-Type: application/json" `
     -d '{\"user\":{\"email\":\"test@example.com\",\"password\":\"password123\",\"password_confirmation\":\"password123\",\"name\":\"Test User\",\"language\":\"en\"}}'
   ```

3. **استخدام Postman:**
   - افتح `postman_collection.json`
   - استورد في Postman
   - جرب الـ endpoints

## 📝 ملاحظات

- **SQLite** مستخدم حالياً للاختبار (بدلاً من PostgreSQL)
- **Swagger gems** معطلة مؤقتاً (rswag)
- بعد تثبيت MSYS2، يمكن تفعيل Swagger gems

## 🔧 استكشاف الأخطاء

### إذا فشل bundle install:
- تأكد من تثبيت MSYS2
- تأكد من إضافة MSYS2 إلى PATH
- جرب: `ridk exec sh -c "pacman -S mingw-w64-x86_64-libyaml"`

### إذا فشل db:create:
- تأكد من SQLite مثبت (عادة يأتي مع Ruby)
- أو ثبت PostgreSQL واستخدمه

## 📞 المساعدة

إذا استمرت المشاكل:
1. راجع `WINDOWS_SETUP.md`
2. تأكد من Ruby 3.4+ مثبت
3. تأكد من Bundler محدث: `gem update bundler`

