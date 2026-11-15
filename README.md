# 🔥 Racha

Racha es una aplicación web social para registrar actividad física entre amigos, mantener rachas y motivarse de forma simple y visual.

La idea nació de algo bastante sencillo: poder ver en un calendario quién del grupo se movió cada día y no cortar la cadena.

Cada integrante tiene su propio avatar, registra su actividad diaria y comparte el progreso con el resto del grupo.

---

## ✨ Funcionalidades

**Cuenta y perfil**

- 🔐 Registro, inicio de sesión y recuperación de contraseña
- 👋 Onboarding inicial
- 🎨 Avatares personalizados y subida de avatar propio

**Grupos**

- 👥 Múltiples grupos por usuario, con selector para cambiar entre ellos
- 🔗 Invitación por código o por link (`?join=CODIGO`)
- 🛠️ Gestión del grupo: renombrar, regenerar código, quitar integrantes, abandonar o eliminar

**Actividad**

- 🏋️ Registro de actividad diaria con tipo y duración (se pueden registrar varias por día)
- ✏️ Edición y eliminación de actividades
- 🃏 Comodines para recuperar un día de los últimos 7
- 💬 Reacciones con emoji a la actividad de otros

**Rachas y motivación**

- 📅 Calendario compartido del grupo
- 🔥 Racha actual y mejor racha histórica, personal y grupal
- 🎯 Objetivo semanal personal por grupo
- 📊 Ranking semanal e historial de semanas del grupo
- 📈 Resumen mensual y anual (días activos, minutos, actividad favorita, mejor racha)
- 🏅 Logros
- 🥇 Torneos dentro del grupo
- 👉 Empujones a quien todavía no se movió

**Notificaciones y app**

- 🔔 Notificaciones sociales dentro de la app
- 📲 Notificaciones push
- ⚡ Actualización en tiempo real (Supabase Realtime)
- 📱 PWA instalable

---

## 🏃 Actividades disponibles

Gym, Caminata, Correr, Bicicleta, Calistenia, Tenis, Natación, Funcional, Yoga, Pilates, Fútbol, Pádel, Boxeo, Baile, Escalada, Vóley, Básquet, Handball y Otra.

La lista vive en `src/data/activities.ts`.

---

## 🧠 Concepto

Racha busca evitar la lógica de una aplicación fitness tradicional cargada de métricas.

La experiencia gira alrededor de una idea mucho más simple:

> **Un día más cuenta.**

El calendario funciona como representación visual del compromiso del grupo.

Cuando alguien entrena, su avatar aparece en ese día.

La intención es generar esa pequeña presión social positiva de entrar y pensar:

> “Ellos ya se movieron. ¿Vos qué onda?”

---

## 🛠️ Tecnologías

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

### Backend / Base de datos

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)

### Deploy

- Netlify

---

## 🗄️ Modelo de datos

Tablas principales:

| Tabla | Para qué |
|---|---|
| `profiles` | Datos públicos de cada usuario (`name`, `avatar_url`, `onboarding_completed`) |
| `groups` | Grupos (`name`, `invite_code`, `created_by`) |
| `group_members` | Usuario ↔ grupo, con `weekly_goal` y `streak_eligible_from` |
| `activities` | Actividades (`activity_date`, `type`, `duration`, `recovered_with_wildcard`) |
| `activity_reactions` | Reacción de un usuario a una actividad (una por usuario) |
| `wildcard_recoveries` | Días recuperados con comodín |
| `group_week_history` / `group_week_member_results` | Historial semanal del grupo |
| `social_notifications` | Notificaciones dentro de la app |
| `notification_preferences` / `push_subscriptions` | Configuración y suscripciones push |

Además, buena parte de la lógica vive en funciones de Postgres que la app llama con `supabase.rpc(...)`: comodines (`get_my_wildcards`), grupos (`join_group_by_code`, `leave_group`, `remove_group_member`, `delete_group`, `regenerate_group_invite_code`), objetivo semanal (`set_my_weekly_goal`), historial (`sync_group_week_history`), empujones (`send_group_nudge`) y torneos (`get_current_tournament`, `choose_tournament_card`, etc.).

---

## 🔒 Seguridad

Racha utiliza Row Level Security de PostgreSQL/Supabase.

Las políticas permiten, entre otras cosas:

- Cada usuario puede modificar únicamente su propio perfil.
- Solamente los miembros pueden acceder a la información de un grupo.
- Un usuario solamente puede crear, editar o eliminar sus propias actividades.
- Los avatares se almacenan en carpetas asociadas al ID del usuario.
- Los grupos utilizan códigos de invitación para incorporar nuevos miembros.

---

## 🚀 Instalación local

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Entrar al proyecto:

```bash
cd racha
```

Instalar dependencias:

```bash
npm install
```

Crear un archivo:

```text
.env.local
```

con las siguientes variables:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_publishable_key
```

Iniciar el entorno de desarrollo:

```bash
npm run dev
```

---

## 📦 Build

Para generar la versión de producción:

```bash
npm run build
```

El resultado se genera en:

```text
dist/
```

---

## 🌐 Deploy

El proyecto está preparado para desplegarse en Netlify.

Configuración:

```text
Build command: npm run build
Publish directory: dist
```

Las variables de entorno también deben configurarse dentro de Netlify:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## 📁 Estructura principal

```text
src/
├── components/   # Piezas de UI: modales, header del grupo, avisos, resumen, logros…
├── data/         # Lista de actividades
├── hooks/        # Lógica con estado: cuenta, datos del grupo, acciones, torneos, comodines…
├── lib/          # Cliente de Supabase, carga de datos, avisos, push
├── pages/        # Pantallas: Home, Calendario, Rachas, Torneos, Perfil, Auth…
├── utils/        # Fechas, rachas y estadísticas
├── App.tsx       # Sesión y recuperación de contraseña
├── RachaApp.tsx  # Decide qué pantalla mostrar y conecta los hooks
└── types.ts
```

Avisos y confirmaciones: en lugar de `window.alert` / `confirm` se usan `showToast(...)` y `await confirmAction({...})` de `src/lib/feedback.ts`.

---

## 🔥 Estado del proyecto

Racha está en uso con grupos reales. El flujo principal:

```text
Crear cuenta
      ↓
Crear o unirse a un grupo
      ↓
Registrar actividad
      ↓
Ver calendario, rachas, ranking y torneos
      ↓
Reaccionar y empujar al resto
```

---

## 🔮 Próximas mejoras

- 📸 Foto opcional en cada actividad
- 💬 Comentarios en las actividades
- 🗃️ Guardar la estructura de la base (migraciones) en el repo

---

## 👨‍💻 Autor

Desarrollado por **Lucas Alonso**.

Full Stack Developer  
Buenos Aires, Argentina

---

<p align="center">
  🔥 <strong>Racha</strong><br/>
  <em>Un día más cuenta.</em>
</p>