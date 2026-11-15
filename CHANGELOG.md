# Cambios

Todas las versiones de Racha. La más nueva arriba.

## 2.0.0 — Noviembre 2026

### Nuevo

- 📸 **Fotos en las actividades.** Opcionales, se comprimen antes de subir. Se ven en el inicio, en el detalle del día y en la galería.
- 💬 **Comentarios** en las actividades, en tiempo real. El dueño de la actividad recibe una notificación.
- 👤 **Perfil de cada integrante**: tocás su avatar y ves racha, récord, semana, mes, actividad favorita, fotos y últimas actividades.
- 🖼️ **Galería del grupo**, con todas las fotos ordenadas por mes.
- 📈 **Resumen mensual y anual** (Rachas → Resumen): días activos, minutos, favorita, mejor racha y ranking del período.
- 🔁 **"Lo mismo que la última vez"**: repetir la última actividad con un toque.
- 🎉 Pantalla de **novedades** que aparece una vez al actualizar.
- La versión de la app se ve al pie de Perfil.

### Mejorado

- Avisos y confirmaciones propios en lugar de los cuadros del navegador (`alert`, `confirm`, `prompt`).
- **Más rápida:** la carga inicial baja de ~604 KB a ~490 KB, porque las pantallas secundarias se descargan cuando hacen falta.
- **Tiempo real más liviano:** una reacción, un comentario o una actividad nueva descargan solo esa actividad, no todo el historial del grupo.

### Para desarrollo

- `RachaApp.tsx` dividido en hooks y componentes (de ~3.200 a ~640 líneas).
- Chequeo automático en GitHub: compila y corre el lint en cada pull request.
- Aviso de errores con Sentry (opcional, con `VITE_SENTRY_DSN`).
- Cambios de base de datos versionados en `supabase/migrations/`.
- README actualizado.

### Base de datos

Correr en orden en Supabase → SQL Editor:

1. `supabase/migrations/20261115120000_fotos_y_comentarios.sql`
2. `supabase/migrations/20261115180000_notificar_comentarios.sql`
