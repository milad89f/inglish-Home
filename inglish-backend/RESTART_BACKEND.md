# Backend'i Yeniden Başlatma

CORS ayarları güncellendi. Backend'i yeniden başlatmanız gerekiyor.

## Adımlar:

1. **Mevcut backend'i durdurun:**
   - Terminal'de `Ctrl+C` ile durdurun
   - Veya: `Get-Process -Id 13628 | Stop-Process` (PID değişebilir)

2. **Backend'i yeniden başlatın:**
   ```powershell
   cd inglish-backend
   rails server
   ```
   
   Backend `http://localhost:3001` adresinde çalışacak.

3. **Frontend'i web modunda başlatın (yeni terminal):**
   ```powershell
   cd avatar-tts-app
   npm run web
   ```

4. **Tarayıcıda test edin:**
   - `http://localhost:8081` adresine gidin
   - Browser console'u açın (F12)
   - Network sekmesinde API isteklerini kontrol edin
   - CORS hatalarını kontrol edin

## CORS Ayarları Güncellendi:

✅ Tüm localhost portlarına izin verildi
✅ Development modunda esnek CORS ayarları
✅ Authorization header expose edildi
✅ Credentials desteği eklendi

