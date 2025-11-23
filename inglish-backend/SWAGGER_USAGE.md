# استخدام Swagger/OpenAPI Documentation

## الخطوات السريعة

### 1. تثبيت Gems
```bash
cd inglish-backend
bundle install
```

### 2. توليد وثائق Swagger
```bash
bundle exec rake rswag:specs:swaggerize
```

### 3. تشغيل الخادم
```bash
rails server
```

### 4. الوصول إلى Swagger UI
افتح المتصفح واذهب إلى:
```
http://localhost:3000/api-docs
```

## المميزات

### ✅ جميع الـ Endpoints موثقة:
- Health Check
- Authentication (Signup, Login, Get Current User)
- Users (Get User Courses)
- Courses (Create, Get, Get Videos, Get Reports, Get Subjects)
- LLM (Generate Analysis, Generate Report, Generate Subject)

### ✅ JWT Authentication
- يمكنك إدخال JWT token في Swagger UI
- اضغط على زر **Authorize** في أعلى الصفحة
- أدخل: `Bearer YOUR_TOKEN_HERE`

### ✅ Premium Membership
- بعض الـ endpoints تتطلب عضوية مميزة
- سيظهر خطأ 403 إذا لم يكن المستخدم premium

### ✅ أمثلة على Requests/Responses
- كل endpoint يحتوي على أمثلة
- يمكنك تجربة الـ endpoints مباشرة من Swagger UI

## تحديث الوثائق

عند إضافة أو تعديل endpoints:

1. عدّل `spec/requests/api/v1/swagger_spec.rb`
2. شغّل: `bundle exec rake rswag:specs:swaggerize`
3. حدّث الصفحة في المتصفح

## ملاحظات

- الوثائق تُولّد تلقائياً من RSpec tests
- ملف Swagger YAML موجود في: `swagger/v1/swagger.yaml`
- يمكن تصدير الوثائق واستخدامها مع أدوات أخرى

