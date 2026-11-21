# Cambios

Todas las versiones de Racha. La más nueva arriba.

## 2.3.0 — Noviembre 2026

### Torneos

- ⏳ **Arranque automático:** si quien tiene que elegir carta (o preparar el próximo torneo) no lo hace en 48 h, se elige una carta al azar. La rueda de turnos sigue igual.
- 🎴 **Aviso de turno:** al abrir la app, si te toca elegir, aparece una ventana con el tiempo que queda. Una sola vez por torneo.
- 🏆 **Premios reales**, que se reclaman con un botón:
  - 🃏 Un comodín por ganador (hasta 6) — 45%
  - 👑 Corona en el avatar por 7 días — 30%
  - 🏷️ Apodo para alguien del grupo por 7 días (de una lista) — 15%
  - 🎴 Elegís el próximo torneo — 7%
  - 📣 Megáfono: mensaje fijo en el inicio de todos por 24 h (de una lista) — 3%
- Los premios simbólicos de antes quedan desactivados.
- En equipos, cada integrante reclama su premio. "Elegís el próximo" lo usa el primero que reclama, y el otro se lleva un comodín.
- Con 0 puntos no se gana.
- 🗄️ **Vitrina de trofeos** en el perfil de cada integrante, con todos los torneos ganados (también los de antes).
- 🎨 **Pantallas de torneo rediseñadas** con la paleta de la app: campeones, premio, podio y equipos.

### Base de datos

Correr en Supabase → SQL Editor:

1. `supabase/migrations/20261121200000_torneos_premios.sql`

## 2.2.0 — Noviembre 2026

### Nuevo

- 🃏 **Premio por invitar**: el link de invitación lleva tu id. Si alguien nuevo se suma con él y registra su primera actividad, ganás 1 comodín (hasta 6) y te llega una notificación.
- La invitación ya no se pierde si el invitado tiene que confirmar el mail antes de entrar.

### Cambiado

- La recarga mensual de comodines ya no recorta el saldo a 3: si tenés más por premios, los conservás. Con 3 o menos funciona igual que antes.

### Base de datos

Correr en Supabase → SQL Editor:

1. `supabase/migrations/20261121160000_premio_por_invitar.sql`

## 2.1.0 — Noviembre 2026

### Nuevo

- 🏁 **Desafíos con fecha** para todo el grupo ("20 días en diciembre"), con progreso y ranking.
- 🔥 **Festejo de hitos**: al llegar a 7, 14, 30, 50, 100, 150, 200 y 365 días seguidos.
- 📲 **Compartir en historias**: el resumen del mes o del año y los hitos como imagen 1080×1920.
- 📱 **Cartel para instalar la app** (Android) y guía paso a paso para iPhone.
- 🔗 **Vista previa** con imagen y texto al compartir el link por WhatsApp e Instagram.
- Ícono adaptable para Android.

### Base de datos

Correr en Supabase → SQL Editor:

1. `supabase/migrations/20261121120000_desafios.sql`

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
