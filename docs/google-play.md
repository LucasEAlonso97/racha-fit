# Publicar Racha en Google Play

Racha se publica en Google Play tal cual está: se "empaqueta" la web en una app de Android (Trusted Web Activity). No hay que rehacer nada, y cada vez que se actualiza la web, la app de Play se actualiza sola.

> ⏱️ **Tiempo total:** 1 tarde de trabajo + **14 días** de prueba cerrada obligatoria (ver paso 4).
> 💵 **Costo:** USD 25, una sola vez (cuenta de desarrollador).

---

## Antes de empezar: lo que Google exige

- [ ] **Política de privacidad** publicada en una URL (`/privacidad`).
- [ ] **Borrar la cuenta desde la app** y también desde una página web (`/eliminar-cuenta`). Es obligatorio si la app permite crear cuenta.
- [ ] Ícono adaptable (`racha-maskable-512.png`). ✅ Ya está.
- [ ] Manifiesto completo (`manifest.webmanifest`). ✅ Ya está.

---

## 1. Crear la cuenta de desarrollador

1. Entrá a <https://play.google.com/console/signup>.
2. Elegí cuenta **personal**.
3. Pagá los USD 25 y verificá tu identidad (DNI). La verificación puede tardar unos días.

## 2. Generar el paquete de Android con PWABuilder

1. Entrá a <https://www.pwabuilder.com> y pegá `https://racha-fit.netlify.app`.
2. Tocá **Package for stores → Android → Generate package**.
3. En las opciones:
   - **Package ID:** `app.netlify.racha_fit` (o el que quieras, pero **no se puede cambiar nunca más**).
   - **App name:** `Racha`.
   - **Signing key:** *Create new*. Completá los datos.
4. Descargá el ZIP. Adentro hay:
   - `app-release-bundle.aab` → lo que se sube a Play.
   - `signing.keystore` y `signing-key-info.txt` → **guardalos en un lugar seguro** (Drive, un USB). Sin ellos no podés actualizar la app nunca más.
   - `assetlinks.json` → para el paso 5.

## 3. Crear la app en Play Console

1. **Crear app** → nombre "Racha", idioma español (Argentina), app gratuita.
2. Completá **Contenido de la app** (menú *Política*):
   - Política de privacidad: `https://racha-fit.netlify.app/privacidad`
   - Eliminación de cuenta: `https://racha-fit.netlify.app/eliminar-cuenta`
   - **Seguridad de los datos**: la app recolecta mail, nombre, foto de perfil, fotos de actividades y actividad física. Nada se vende ni se comparte con terceros. Todo viaja cifrado (HTTPS). El usuario puede borrar todo.
   - Público objetivo: mayores de 13 (o 18, como prefieras).
   - Anuncios: no.
3. **Ficha de la tienda**:
   - Descripción corta (80 caracteres): *Mantené la racha con tus amigos. Registrá tu actividad y motivate en grupo.*
   - Ícono 512×512: `public/racha-512.png`.
   - Imagen destacada 1024×500.
   - Al menos 2 capturas del celular (sacalas desde la app).

## 4. Prueba cerrada: 12 personas durante 14 días (obligatoria)

Las cuentas personales nuevas **no pueden publicar directo**. Primero:

1. **Pruebas → Prueba cerrada → Crear versión** → subí el `.aab`.
2. **Testers:** creá una lista con los mails de Gmail de **al menos 12 personas** (tu grupo de Racha es perfecto).
3. Esperá a que Google apruebe la versión de prueba (1 a 3 días) y **recién ahí** mandales el link para unirse.
4. Cada uno tiene que tocar el link, aceptar e **instalar desde Play**. Tienen que seguir anotados **14 días seguidos**. Si bajan de 12, el contador se frena.
5. Pasados los 14 días: **Solicitar acceso a producción** y responder unas preguntas sobre la prueba.

## 5. Conectar la app con la web (assetlinks)

Sin esto, la app abre con una barra de navegador arriba.

1. En Play Console: **Prueba y lanzamiento → Configuración → Integridad de la app → Firma de apps**.
2. Copiá el **SHA-256** de "Certificado de la clave de firma de apps".
3. Creá el archivo `public/.well-known/assetlinks.json` en el repo:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.netlify.racha_fit",
    "sha256_cert_fingerprints": [
      "PEGAR_ACÁ_EL_SHA256_DE_PLAY",
      "PEGAR_ACÁ_EL_SHA256_DEL_assetlinks.json_DE_PWABUILDER"
    ]
  }
}]
```

4. Subilo (commit + push a `main`) y verificá que abra: <https://racha-fit.netlify.app/.well-known/assetlinks.json>.

## 6. Publicar

Con el acceso a producción aprobado: **Producción → Crear versión** → el mismo `.aab` → enviar a revisión. La primera revisión tarda de 1 a 7 días.

---

### Actualizaciones

Los cambios de la web llegan solos a la app de Play. Solo hay que subir un `.aab` nuevo si cambian el ícono, el nombre o los colores. En ese caso hay que generarlo en PWABuilder **con la misma clave** (`signing.keystore`).
