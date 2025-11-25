# Iconos PWA

Este directorio debe contener los iconos para la PWA.

## Iconos Requeridos

- `icon-192x192.png` - Icono 192x192px
- `icon-512x512.png` - Icono 512x512px

## Generar Iconos

Puedes generar estos iconos desde un logo usando herramientas como:

1. **PWA Asset Generator** (recomendado):
   ```bash
   npx pwa-asset-generator logo.png public/icons
   ```

2. **Online tools**:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

3. **Manualmente**: Crea imágenes PNG de 192x192 y 512x512px desde tu logo

## Nota para Desarrollo

En desarrollo, los iconos son opcionales. La app funcionará sin ellos, pero verás warnings en la consola.

Para producción, asegúrate de tener ambos iconos antes de hacer build.

