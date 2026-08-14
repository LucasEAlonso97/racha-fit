# 🔥 Racha

Racha es una aplicación web social para registrar actividad física entre amigos, mantener rachas y motivarse de forma simple y visual.

La idea nació de algo bastante sencillo: poder ver en un calendario quién del grupo se movió cada día y no cortar la cadena.

Cada integrante tiene su propio avatar, registra su actividad diaria y comparte el progreso con el resto del grupo.

---

## ✨ Funcionalidades

- 🔐 Registro e inicio de sesión
- 👤 Perfiles de usuario
- 🎨 Avatares personalizados
- 📸 Subida de avatar propio
- 👥 Creación de grupos privados
- 🔗 Código de invitación para unirse a un grupo
- 🏋️ Registro de actividad física diaria
- ⏱️ Registro de duración de la actividad
- ✏️ Edición y eliminación de actividades
- 📅 Calendario compartido del grupo
- 🔥 Cálculo de racha actual
- 🏆 Mejor racha histórica
- 📊 Ranking semanal
- 🎯 Meta semanal de actividad
- 👀 Visualización de la actividad de otros integrantes

---

## 🏃 Actividades disponibles

Actualmente se pueden registrar:

- 🏋️ Gym
- 🚶 Caminata
- 🏃 Correr
- 🚲 Bicicleta
- ✨ Otra

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

La aplicación utiliza las siguientes entidades principales:

### `profiles`

Información pública de cada usuario.

- `id`
- `name`
- `avatar_url`

### `groups`

Grupos de amigos que comparten una Racha.

- `id`
- `name`
- `invite_code`
- `created_by`

### `group_members`

Relaciona usuarios con grupos.

- `group_id`
- `user_id`

### `activities`

Actividad diaria registrada por cada integrante.

- `id`
- `user_id`
- `group_id`
- `activity_date`
- `type`
- `duration`

Cada usuario puede registrar una única actividad por día dentro de un grupo.

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
├── components/
│   ├── ActivityModal.tsx
│   ├── BottomNavigation.tsx
│   ├── DayDetailModal.tsx
│   └── UserAvatar.tsx
│
├── data/
│   └── activities.ts
│
├── lib/
│   └── supabase.ts
│
├── pages/
│   ├── Auth.tsx
│   ├── Calendar.tsx
│   ├── GroupSetup.tsx
│   ├── Home.tsx
│   ├── Perfil.tsx
│   └── Rachas.tsx
│
├── utils/
│   ├── activityStats.ts
│   └── date.ts
│
├── App.tsx
├── RachaApp.tsx
├── main.tsx
├── index.css
└── types.ts
```

---

## 🔥 Estado del proyecto

Racha se encuentra actualmente en etapa MVP.

El flujo principal ya permite:

```text
Crear cuenta
      ↓
Crear o unirse a un grupo
      ↓
Personalizar perfil
      ↓
Registrar actividad
      ↓
Ver calendario compartido
      ↓
Comparar rachas
```

---

## 🔮 Próximas mejoras

Algunas ideas para futuras versiones:

- ⚡ Actualización en tiempo real
- 🔔 Notificaciones
- 💬 Reacciones entre integrantes
- 📈 Estadísticas mensuales
- 🏅 Logros y badges
- 👥 Múltiples grupos por usuario
- 📱 PWA instalable
- 🔗 Invitaciones mediante links
- 🎯 Metas personalizadas
- 🥇 Desafíos entre amigos

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