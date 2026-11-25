# Cambios

Todas las versiones de Racha. La más nueva arriba.

## 2.6.1 — Noviembre 2026

- 🔄 **Tirar hacia abajo para actualizar** en Inicio. Sin señal, avisa y se queda con lo guardado.
- ➕ El botón **+** es más chico y flota un poco más arriba: ya no tapa Rachas. La barra respeta la rayita de gestos del iPhone.
- 🔠 Textos de la barra de abajo más grandes (de 9 a 11 px).
- 📱 Recordatorios: el segundo horario ya no se sale de la pantalla en iPhone.

No hay que correr nada en la base.

## 2.6.0 — Noviembre 2026

### Más rápida y liviana

- ⚡ **Abre al toque:** la app guarda en el celu lo último que viste (perfil, grupos, actividades) y lo muestra apenas abrís, mientras trae lo nuevo de fondo.
- 🐛 **Arreglo importante:** Supabase devuelve como máximo 1000 filas por consulta. Cuando un grupo pasaba las 1000 actividades, las **más nuevas** dejaban de aparecer. Ahora se piden de a páginas.
- 📉 El historial de más de 4 meses se trae sin comentarios (lo que más pesa). Los comentarios de un día viejo se cargan cuando lo abrís. Las rachas se siguen calculando con todo el historial.
- 🖼️ Íconos e imágenes optimizados (de ~750 KB a ~300 KB).

### Sin señal

- 📶 **La app abre aunque no haya internet**, con lo último guardado. Con señal débil, entra a los 4 segundos en vez de quedarse "Cargando...".
- Junto con lo de la 2.5.0 (cargar actividades sin señal), ya se puede usar Racha en un subsuelo.

### Diseño

- 👇 **Cerrar ventanas deslizando hacia abajo**, como en Instagram o WhatsApp.
- 🟪 **Mapa de calor del año** en el perfil: un cuadradito por día, más oscuro cuanto más entrenaste. Tocá un día para ver qué hiciste; con las flechas ves años anteriores.

### Base de datos

No hay que correr nada.

## 2.5.0 — Noviembre 2026

### Sin señal

- 📶 Si guardás la actividad del día sin internet (por ejemplo, en un subsuelo), queda guardada en el celu con la marca "Sin señal · se envía sola" y se manda sola cuando vuelve la conexión.
- Recuperar días pasados con comodín sigue necesitando internet.

### Más ágil

- ↩️ **Deshacer:** borrar una actividad o un comentario ya no pregunta "¿Estás seguro?". Se borra al toque y aparece "Deshacer" por 5 segundos.
- 🔥 **Festejo** con fueguitos al cargar la actividad del día, y vibración en Android (también al reaccionar).
- 💀 **Pantallas de carga** con la forma de la app en gris, en vez del cartel "Cargando...".

### Publicaciones

- ✨ **Aviso de versión nueva:** al volver a la app, si hay una publicación nueva aparece un cartel con "Actualizar".
- 🔁 Si alguien tenía la app abierta durante una publicación y entra a una pantalla que cambió, la app se recarga sola en vez de mostrar un error.

### Base de datos

No hay que correr nada.

## 2.4.0 — Noviembre 2026

### Racha Wrapped

- 🎁 **Tu año en Racha**, en formato historias: días entrenados, horas, deporte del año, racha más larga, mejor mes, día favorito, compañero de racha, puesto en el grupo, torneos ganados, fotos y días salvados con comodín. Cierra con una frase que te define.
- 📲 Botón para compartir una imagen en historias de Instagram/WhatsApp.
- En Inicio aparece un banner del 1 de diciembre al 31 de enero. En el perfil está siempre ("hasta ahora").
- Se calcula con los datos del grupo activo: no necesita nada en la base de datos.

### Comodines por constancia

- 🃏 Cada **4 semanas seguidas cumpliendo tu meta semanal** ganás 1 comodín (hasta 6).
- Cuenta si cumplís la meta en cualquiera de tus grupos. Los días recuperados con comodín no suman.
- Al abrir la app el lunes se revisa la semana anterior; si ganaste, aparece un festejo.
- En el perfil, dentro de Comodines, se ve el progreso (x/4 semanas) y cómo vas esta semana.

### Arreglos

- 📱 En el celu la app ya no se agranda al tocar un campo de texto (por ejemplo, al comentar).

### Base de datos

Correr en Supabase → SQL Editor:

1. `supabase/migrations/20261125120000_comodines_por_constancia.sql`

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
