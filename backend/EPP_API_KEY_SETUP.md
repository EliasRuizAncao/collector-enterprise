# Configuración de API Key para ESP32-CAM

El endpoint `/api/v1/epp/analyze` usa autenticación por API Key en lugar de Firebase Auth para permitir que dispositivos IoT (ESP32-CAM) envíen imágenes.

## Configuración del Backend

### 1. Agregar variable de entorno

Agrega la siguiente variable a tu archivo `.env`:

```env
AMARANTO_IOT_SECRET=tu_clave_secreta_muy_segura_aqui
```

**Importante**: 
- Usa una clave larga y aleatoria (mínimo 32 caracteres)
- Nunca commitees esta clave al repositorio
- Genera una clave diferente para producción

### 2. Generar una clave segura

Puedes generar una clave segura con:

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O en Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## Configuración del ESP32-CAM

### Headers requeridos

El ESP32 debe incluir el siguiente header en la petición:

```
x-api-key: tu_clave_secreta_muy_segura_aqui
```

### Ejemplo de código para ESP32

**IMPORTANTE**: El servidor responde con `202 Accepted` inmediatamente y procesa la imagen en background. 
Esto evita timeouts. El ESP32 debe tener un timeout de al menos 5 segundos.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <Camera.h>

const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";
const char* serverURL = "http://tu-servidor.com/api/v1/epp/analyze";
const char* apiKey = "tu_clave_secreta_muy_segura_aqui";

void setup() {
  Serial.begin(115200);
  
  // Configurar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // Configurar cámara
  camera_config_t config;
  // ... configuración de la cámara ...
  esp_camera_init(&config);
}

void loop() {
  // Capturar imagen
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Error al capturar imagen");
    return;
  }
  
  // Enviar imagen
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("x-api-key", apiKey);
  http.addHeader("Content-Type", "image/jpeg");
  
  // IMPORTANTE: Configurar timeout suficiente (al menos 10 segundos)
  http.setTimeout(10000); // 10 segundos
  
  int httpResponseCode = http.POST((uint8_t*)fb->buf, fb->len);
  
  // El servidor responde con 202 Accepted (no 200)
  if (httpResponseCode == 202) {
    String response = http.getString();
    Serial.println("✓ Imagen recibida por el servidor (procesando en background)");
    Serial.println(response);
  } else if (httpResponseCode == 200) {
    // También aceptar 200 por compatibilidad
    Serial.println("✓ Imagen procesada exitosamente");
  } else {
    Serial.print("✗ Error: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println(response);
  }
  
  http.end();
  esp_camera_fb_return(fb);
  
  delay(5000); // Esperar 5 segundos antes de la siguiente captura
}
```

### Ejemplo con curl (para pruebas)

```bash
curl -X POST http://localhost:3000/api/v1/epp/analyze \
  -H "x-api-key: tu_clave_secreta_muy_segura_aqui" \
  -H "Content-Type: image/jpeg" \
  --data-binary @imagen.jpg
```

## Comportamiento del Endpoint

### POST /api/v1/epp/analyze

- **Respuesta inmediata**: El servidor responde con `202 Accepted` inmediatamente después de recibir la imagen
- **Procesamiento en background**: El análisis con YOLOv8 se ejecuta en segundo plano (puede tardar 5-15 segundos)
- **Consulta de resultados**: Usa `GET /api/v1/epp/status` para obtener los resultados del análisis

**Ventajas**:
- ✅ Evita timeouts en el ESP32-CAM
- ✅ El ESP32 no necesita esperar el procesamiento completo
- ✅ Múltiples imágenes pueden enviarse sin bloquearse

## Seguridad

- ✅ La API Key se compara de forma segura (comparación constante)
- ✅ Los intentos fallidos se registran en los logs
- ✅ Solo el endpoint `/analyze` usa API Key; `/status` sigue usando Firebase Auth
- ⚠️ **Importante**: Usa HTTPS en producción para proteger la API Key en tránsito

## Troubleshooting

### Error: "API Key no proporcionada"
- Verifica que el ESP32 esté enviando el header `x-api-key`
- El header puede estar en cualquier caso (se acepta `x-api-key`, `X-API-Key`, etc.)

### Error: "API Key inválida"
- Verifica que la clave en `.env` coincida exactamente con la del ESP32
- No debe haber espacios en blanco al inicio o final
- Verifica que la variable `AMARANTO_IOT_SECRET` esté cargada correctamente

### Error: "Configuración del servidor incompleta"
- La variable `AMARANTO_IOT_SECRET` no está definida en `.env`
- Reinicia el servidor después de agregar la variable

### Error: "read Timeout" en ESP32
- **Solución aplicada**: El servidor ahora responde inmediatamente con `202 Accepted`
- Asegúrate de que el ESP32 tenga `http.setTimeout(10000)` configurado (al menos 10 segundos)
- El servidor procesa en background, el ESP32 no necesita esperar
- Si persiste, verifica la velocidad de tu conexión WiFi

### No veo resultados en el panel
- El procesamiento puede tardar 5-15 segundos
- El panel hace polling cada 1 segundo, debería aparecer automáticamente
- Verifica los logs del servidor para ver si hay errores en el procesamiento

