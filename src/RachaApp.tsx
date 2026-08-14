import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  Session,
} from '@supabase/supabase-js'

import {
  Copy,
  LogOut,
} from 'lucide-react'

import ActivityModal from './components/ActivityModal'
import BottomNavigation from './components/BottomNavigation'
import DayDetailModal from './components/DayDetailModal'

import Calendar from './pages/Calendar'
import GroupSetup from './pages/GroupSetup'
import Home from './pages/Home'
import Perfil from './pages/Perfil'
import Rachas from './pages/Rachas'

import {
  supabase,
} from './lib/supabase'

import {
  formatDateKey,
} from './utils/date'

import type {
  ActivitiesByDate,
  Activity,
  ActivityType,
  Group,
  Profile,
  User,
  View,
} from './types'

type Props = {
  session: Session
}

type MemberRow = {
  user_id: string

  profile: {
    id: string
    name: string
    avatar_url: string | null
  } | null
}

type ActivityRow = {
  id: string
  user_id: string
  activity_date: string
  type: string
  duration: number
}

const avatarColors = [
  'bg-violet-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-orange-500',
]

function RachaApp({
  session,
}: Props) {
  /*
   * ========================================
   * FECHA ACTUAL
   * ========================================
   */

  const today = useMemo(
    () => new Date(),
    [],
  )

  const todayKey =
    formatDateKey(today)

  /*
   * ========================================
   * USUARIO AUTENTICADO
   * ========================================
   */

  const currentUserId =
    session.user.id

  /*
   * ========================================
   * PERFIL
   * ========================================
   */

  const [
    profile,
    setProfile,
  ] =
    useState<Profile | null>(
      null,
    )

  /*
   * ========================================
   * GRUPO ACTIVO
   * ========================================
   */

  const [
    activeGroup,
    setActiveGroup,
  ] =
    useState<Group | null>(
      null,
    )

  /*
   * ========================================
   * ESTADO DE LA CUENTA
   * ========================================
   */

  const [
    accountLoading,
    setAccountLoading,
  ] =
    useState(true)

  const [
    accountError,
    setAccountError,
  ] =
    useState<string | null>(
      null,
    )

  /*
   * ========================================
   * USUARIOS DEL GRUPO
   * ========================================
   */

  const [
    users,
    setUsers,
  ] =
    useState<User[]>([])

  /*
   * ========================================
   * ACTIVIDADES
   * ========================================
   *
   * Ahora soportamos múltiples
   * actividades por usuario y día:
   *
   * activities[fecha][usuario] = [
   *   actividad1,
   *   actividad2,
   *   actividad3
   * ]
   */

  const [
    activities,
    setActivities,
  ] =
    useState<ActivitiesByDate>(
      {},
    )

  /*
   * ========================================
   * ESTADO DE CARGA DEL GRUPO
   * ========================================
   */

  const [
    groupLoading,
    setGroupLoading,
  ] =
    useState(false)

  const [
    groupError,
    setGroupError,
  ] =
    useState<string | null>(
      null,
    )

  /*
   * ========================================
   * NAVEGACIÓN
   * ========================================
   */

  const [
    view,
    setView,
  ] =
    useState<View>('home')

  /*
   * ========================================
   * DÍA SELECCIONADO
   * ========================================
   */

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<string | null>(
      null,
    )

  /*
   * ========================================
   * FECHA DE ACTIVIDAD EN EDICIÓN
   * ========================================
   */

  const [
    editingDate,
    setEditingDate,
  ] =
    useState(todayKey)

  /*
   * ========================================
   * ID DE ACTIVIDAD EN EDICIÓN
   * ========================================
   *
   * null:
   * estamos creando una actividad nueva.
   *
   * UUID:
   * estamos editando una actividad existente.
   */

  const [
    editingActivityId,
    setEditingActivityId,
  ] =
    useState<string | null>(
      null,
    )

  /*
   * ========================================
   * MODAL DE ACTIVIDAD
   * ========================================
   */

  const [
    activityModalOpen,
    setActivityModalOpen,
  ] =
    useState(false)

  /*
   * ========================================
   * CARGAR PERFIL + GRUPOS
   * ========================================
   */

  useEffect(() => {
    const loadAccount =
      async () => {
        setAccountLoading(
          true,
        )

        setAccountError(
          null,
        )

        const [
          profileResult,
          groupsResult,
        ] =
          await Promise.all([
            /*
             * PERFIL
             */

            supabase
              .from('profiles')
              .select(
                'id, name, avatar_url',
              )
              .eq(
                'id',
                currentUserId,
              )
              .single(),

            /*
             * GRUPOS
             */

            supabase
              .from('groups')
              .select(
                'id, name, invite_code, created_by',
              )
              .order(
                'created_at',
                {
                  ascending:
                    true,
                },
              ),
          ])

        /*
         * ERROR PERFIL
         */

        if (
          profileResult.error ||
          !profileResult.data
        ) {
          console.error(
            'Error cargando perfil:',
            profileResult.error,
          )

          setAccountError(
            'No pudimos cargar tu perfil.',
          )

          setAccountLoading(
            false,
          )

          return
        }

        /*
         * ERROR GRUPOS
         */

        if (
          groupsResult.error
        ) {
          console.error(
            'Error cargando grupos:',
            groupsResult.error,
          )

          setAccountError(
            'No pudimos cargar tus grupos.',
          )

          setAccountLoading(
            false,
          )

          return
        }

        /*
         * GUARDAR PERFIL
         */

        setProfile(
          profileResult.data as Profile,
        )

        /*
         * POR AHORA:
         * usamos el primer grupo
         * disponible del usuario.
         */

        const firstGroup =
          groupsResult.data?.[0] ??
          null

        setActiveGroup(
          firstGroup
            ? (firstGroup as Group)
            : null,
        )

        setAccountLoading(
          false,
        )
      }

    void loadAccount()
  }, [currentUserId])

  /*
   * ========================================
   * CARGAR MIEMBROS + ACTIVIDADES DEL GRUPO
   * ========================================
   */

  useEffect(() => {
    if (!activeGroup) {
      setUsers([])
      setActivities({})

      return
    }

    const loadGroupData =
      async () => {
        setGroupLoading(
          true,
        )

        setGroupError(
          null,
        )

        const [
          membersResult,
          activitiesResult,
        ] =
          await Promise.all([
            /*
             * MIEMBROS DEL GRUPO
             */

            supabase
              .from(
                'group_members',
              )
              .select(`
                user_id,
                profile:profiles!group_members_user_id_fkey (
                  id,
                  name,
                  avatar_url
                )
              `)
              .eq(
                'group_id',
                activeGroup.id,
              ),

            /*
             * ACTIVIDADES DEL GRUPO
             */

            supabase
              .from(
                'activities',
              )
              .select(`
                id,
                user_id,
                activity_date,
                type,
                duration
              `)
              .eq(
                'group_id',
                activeGroup.id,
              )
              .order(
                'created_at',
                {
                  ascending:
                    true,
                },
              ),
          ])

        /*
         * ERROR MIEMBROS
         */

        if (
          membersResult.error
        ) {
          console.error(
            'Error cargando miembros:',
            membersResult.error,
          )

          setGroupError(
            'No pudimos cargar los integrantes.',
          )

          setGroupLoading(
            false,
          )

          return
        }

        /*
         * ERROR ACTIVIDADES
         */

        if (
          activitiesResult.error
        ) {
          console.error(
            'Error cargando actividades:',
            activitiesResult.error,
          )

          setGroupError(
            'No pudimos cargar las actividades.',
          )

          setGroupLoading(
            false,
          )

          return
        }

        /*
         * ========================================
         * CONVERTIR MIEMBROS DE SUPABASE
         * A USERS DE LA UI
         * ========================================
         */

        const memberRows =
          (
            membersResult.data ??
            []
          ) as unknown as MemberRow[]

        const loadedUsers =
          memberRows
            .filter(
              (member) =>
                Boolean(
                  member.profile,
                ),
            )
            .map(
              (
                member,
                index,
              ): User => {
                const memberProfile =
                  member.profile!

                return {
                  id:
                    memberProfile.id,

                  name:
                    memberProfile.name,

                  avatar:
                    memberProfile.avatar_url,

                  fallback:
                    memberProfile.name
                      .trim()
                      .charAt(0)
                      .toUpperCase() ||
                    '?',

                  avatarColor:
                    avatarColors[
                      index %
                        avatarColors.length
                    ],
                }
              },
            )
            .sort(
              (a, b) => {
                /*
                 * El usuario actual
                 * aparece primero.
                 */

                if (
                  a.id ===
                  currentUserId
                ) {
                  return -1
                }

                if (
                  b.id ===
                  currentUserId
                ) {
                  return 1
                }

                return a.name.localeCompare(
                  b.name,
                )
              },
            )

        setUsers(
          loadedUsers,
        )

        /*
         * ========================================
         * CONVERTIR ACTIVIDADES
         * ========================================
         *
         * Supabase devuelve filas:
         *
         * [
         *   {
         *     id,
         *     user_id,
         *     activity_date,
         *     type,
         *     duration
         *   }
         * ]
         *
         * Nosotros necesitamos:
         *
         * {
         *   "2026-08-14": {
         *
         *     "uuid-lucas": [
         *       {
         *         id: "...",
         *         type: "Gym",
         *         duration: 60
         *       },
         *       {
         *         id: "...",
         *         type: "Caminata",
         *         duration: 40
         *       }
         *     ],
         *
         *     "uuid-edith": [
         *       {
         *         id: "...",
         *         type: "Gym",
         *         duration: 45
         *       }
         *     ]
         *   }
         * }
         */

        const activityRows =
          (
            activitiesResult.data ??
            []
          ) as ActivityRow[]

        const activityMap:
          ActivitiesByDate =
            {}

        activityRows.forEach(
          (row) => {
            /*
             * Si todavía no existe
             * el día, lo creamos.
             */

            if (
              !activityMap[
                row.activity_date
              ]
            ) {
              activityMap[
                row.activity_date
              ] = {}
            }

            /*
             * Si todavía no existe
             * el array del usuario,
             * lo creamos.
             */

            if (
              !activityMap[
                row.activity_date
              ][
                row.user_id
              ]
            ) {
              activityMap[
                row.activity_date
              ][
                row.user_id
              ] = []
            }

            /*
             * Agregamos la actividad.
             */

            activityMap[
              row.activity_date
            ][
              row.user_id
            ].push({
              id:
                row.id,

              type:
                row.type as ActivityType,

              duration:
                row.duration,
            })
          },
        )

        setActivities(
          activityMap,
        )

        setGroupLoading(
          false,
        )
      }

    void loadGroupData()
  }, [
    activeGroup,
    currentUserId,
  ])

  /*
   * ========================================
   * USUARIO ACTUAL
   * ========================================
   */

  const currentUser =
    users.find(
      (user) =>
        user.id ===
        currentUserId,
    )

  /*
   * ========================================
   * ABRIR MODAL DE ACTIVIDAD
   * ========================================
   *
   * Ejemplo nueva:
   *
   * openActivityModal("2026-08-14")
   *
   * Ejemplo editar:
   *
   * openActivityModal(
   *   "2026-08-14",
   *   "uuid-actividad"
   * )
   */

  const openActivityModal = (
    dateKey = todayKey,
    activityId:
      string | null = null,
  ) => {
    setSelectedDate(
      null,
    )

    setEditingDate(
      dateKey,
    )

    setEditingActivityId(
      activityId,
    )

    setActivityModalOpen(
      true,
    )
  }

  /*
   * ========================================
   * CERRAR MODAL DE ACTIVIDAD
   * ========================================
   */

  const closeActivityModal =
    () => {
      setActivityModalOpen(
        false,
      )

      setEditingActivityId(
        null,
      )
    }

  /*
   * ========================================
   * ACTIVIDAD ACTUAL EN EDICIÓN
   * ========================================
   */

  const currentEditingActivity =
    editingActivityId
      ? (
          activities[
            editingDate
          ]?.[
            currentUserId
          ] ?? []
        ).find(
          (activity) =>
            activity.id ===
            editingActivityId,
        )
      : undefined

  /*
   * ========================================
   * GUARDAR ACTIVIDAD
   * ========================================
   *
   * Si editingActivityId existe:
   * hacemos UPDATE.
   *
   * Si no:
   * hacemos INSERT.
   */

  const saveActivity =
    async (
      activity: Activity,
    ) => {
      if (!activeGroup) {
        return
      }

      /*
       * ========================================
       * EDITAR ACTIVIDAD EXISTENTE
       * ========================================
       */

      if (
        editingActivityId
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'activities',
            )
            .update({
              type:
                activity.type,

              duration:
                activity.duration,
            })
            .eq(
              'id',
              editingActivityId,
            )
            .eq(
              'user_id',
              currentUserId,
            )
            .eq(
              'group_id',
              activeGroup.id,
            )
            .select(
              'id, type, duration',
            )
            .single()

        if (
          error ||
          !data
        ) {
          console.error(
            'Error editando actividad:',
            error,
          )

          window.alert(
            'No pudimos editar la actividad.',
          )

          return
        }

        /*
         * Actualizar estado local.
         */

        setActivities(
          (
            currentActivities,
          ) => {
            const currentDay =
              currentActivities[
                editingDate
              ] ?? {}

            const userActivities =
              currentDay[
                currentUserId
              ] ?? []

            const updatedActivities =
              userActivities.map(
                (
                  currentActivity,
                ) =>
                  currentActivity.id ===
                  editingActivityId
                    ? {
                        id:
                          data.id,

                        type:
                          data.type as ActivityType,

                        duration:
                          data.duration,
                      }
                    : currentActivity,
              )

            return {
              ...currentActivities,

              [editingDate]: {
                ...currentDay,

                [currentUserId]:
                  updatedActivities,
              },
            }
          },
        )

        closeActivityModal()

        return
      }

      /*
       * ========================================
       * CREAR ACTIVIDAD NUEVA
       * ========================================
       */

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'activities',
          )
          .insert({
            user_id:
              currentUserId,

            group_id:
              activeGroup.id,

            activity_date:
              editingDate,

            type:
              activity.type,

            duration:
              activity.duration,
          })
          .select(
            'id, type, duration',
          )
          .single()

      if (
        error ||
        !data
      ) {
        console.error(
          'Error guardando actividad:',
          error,
        )

        window.alert(
          'No pudimos guardar la actividad.',
        )

        return
      }

      /*
       * Convertir fila nueva
       * a nuestro Activity.
       */

      const newActivity:
        Activity = {
          id:
            data.id,

          type:
            data.type as ActivityType,

          duration:
            data.duration,
        }

      /*
       * Agregar actividad
       * al estado local.
       */

      setActivities(
        (
          currentActivities,
        ) => {
          const currentDay =
            currentActivities[
              editingDate
            ] ?? {}

          const userActivities =
            currentDay[
              currentUserId
            ] ?? []

          return {
            ...currentActivities,

            [editingDate]: {
              ...currentDay,

              [currentUserId]: [
                ...userActivities,
                newActivity,
              ],
            },
          }
        },
      )

      closeActivityModal()
    }

  /*
   * ========================================
   * ELIMINAR ACTIVIDAD
   * ========================================
   *
   * Ahora eliminamos UNA actividad
   * mediante su ID.
   *
   * Ya no eliminamos todo
   * el día del usuario.
   */

  const deleteActivity =
    async () => {
      if (
        !activeGroup ||
        !editingActivityId
      ) {
        return
      }

      const activityIdToDelete =
        editingActivityId

      const {
        error,
      } =
        await supabase
          .from(
            'activities',
          )
          .delete()
          .eq(
            'id',
            activityIdToDelete,
          )
          .eq(
            'user_id',
            currentUserId,
          )
          .eq(
            'group_id',
            activeGroup.id,
          )

      if (error) {
        console.error(
          'Error eliminando actividad:',
          error,
        )

        window.alert(
          'No pudimos eliminar la actividad.',
        )

        return
      }

      /*
       * Actualizar estado local.
       */

      setActivities(
        (
          currentActivities,
        ) => {
          const copy = {
            ...currentActivities,
          }

          const currentDay = {
            ...(copy[
              editingDate
            ] ?? {}),
          }

          const userActivities =
            currentDay[
              currentUserId
            ] ?? []

          const remainingActivities =
            userActivities.filter(
              (activity) =>
                activity.id !==
                activityIdToDelete,
            )

          /*
           * Si todavía tiene actividades
           * ese día, mantenemos al usuario.
           */

          if (
            remainingActivities.length >
            0
          ) {
            currentDay[
              currentUserId
            ] =
              remainingActivities
          } else {
            /*
             * Si eliminó su última actividad,
             * eliminamos al usuario de ese día.
             */

            delete currentDay[
              currentUserId
            ]
          }

          /*
           * Si ya no queda ningún usuario
           * con actividades ese día,
           * eliminamos el día completo.
           */

          if (
            Object.keys(
              currentDay,
            ).length === 0
          ) {
            delete copy[
              editingDate
            ]
          } else {
            copy[
              editingDate
            ] =
              currentDay
          }

          return copy
        },
      )

      closeActivityModal()
    }

  /*
   * ========================================
   * GUARDAR PERFIL
   * ========================================
   */

  const saveProfile =
    async (
      name: string,
      avatarUrl: string | null,
      avatarFile: File | null,
    ) => {
      let finalAvatarUrl =
        avatarUrl

      /*
       * ========================================
       * SUBIR AVATAR PERSONALIZADO
       * ========================================
       */

      if (avatarFile) {
        const avatarPath =
          `${currentUserId}/avatar`

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from('avatars')
            .upload(
              avatarPath,
              avatarFile,
              {
                upsert: true,

                contentType:
                  avatarFile.type,

                cacheControl:
                  '3600',
              },
            )

        if (
          uploadError
        ) {
          console.error(
            'Error subiendo avatar:',
            uploadError,
          )

          window.alert(
            'No pudimos subir tu dibu.',
          )

          return false
        }

        /*
         * Obtener URL pública.
         */

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from('avatars')
            .getPublicUrl(
              avatarPath,
            )

        /*
         * Agregamos versión
         * para evitar caché.
         */

        finalAvatarUrl =
          `${
            publicUrlData.publicUrl
          }?v=${Date.now()}`
      }

      /*
       * ========================================
       * ACTUALIZAR PROFILE EN SUPABASE
       * ========================================
       */

      const {
        data,
        error,
      } =
        await supabase
          .from('profiles')
          .update({
            name,

            avatar_url:
              finalAvatarUrl,
          })
          .eq(
            'id',
            currentUserId,
          )
          .select(
            'id, name, avatar_url',
          )
          .single()

      if (
        error ||
        !data
      ) {
        console.error(
          'Error actualizando perfil:',
          error,
        )

        window.alert(
          'No pudimos guardar tu perfil.',
        )

        return false
      }

      const updatedProfile =
        data as Profile

      /*
       * Actualizamos profile.
       */

      setProfile(
        updatedProfile,
      )

      /*
       * Actualizamos usuario
       * dentro de la UI.
       */

      setUsers(
        (
          currentUsers,
        ) =>
          currentUsers.map(
            (user) =>
              user.id ===
              currentUserId
                ? {
                    ...user,

                    name:
                      updatedProfile.name,

                    avatar:
                      updatedProfile.avatar_url,

                    fallback:
                      updatedProfile.name
                        .trim()
                        .charAt(0)
                        .toUpperCase() ||
                      '?',
                  }
                : user,
          ),
      )

      return true
    }

  /*
   * ========================================
   * CERRAR SESIÓN
   * ========================================
   */

  const handleLogout =
    async () => {
      const {
        error,
      } =
        await supabase.auth.signOut()

      if (error) {
        console.error(
          'Error cerrando sesión:',
          error,
        )
      }
    }

  /*
   * ========================================
   * COPIAR CÓDIGO DE INVITACIÓN
   * ========================================
   */

  const copyInviteCode =
    async () => {
      if (!activeGroup) {
        return
      }

      try {
        await navigator.clipboard.writeText(
          activeGroup.invite_code,
        )
      } catch (error) {
        console.error(
          'No se pudo copiar el código:',
          error,
        )
      }
    }

  /*
   * ========================================
   * PANTALLA DE CARGA DE CUENTA
   * ========================================
   */

  if (accountLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">
            🔥
          </div>

          <p className="mt-3 font-bold text-violet-500">
            Cargando Racha...
          </p>
        </div>
      </main>
    )
  }

  /*
   * ========================================
   * ERROR DE CUENTA
   * ========================================
   */

  if (
    accountError ||
    !profile
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-sm">
          <div className="text-4xl">
            😵
          </div>

          <h1 className="mt-4 text-xl font-black text-zinc-800">
            Algo salió mal
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {accountError ??
              'No pudimos cargar tu cuenta.'}
          </p>

          <button
            onClick={
              handleLogout
            }
            className="mt-5 rounded-2xl bg-violet-500 px-5 py-3 font-bold text-white"
          >
            Volver al login
          </button>
        </div>
      </main>
    )
  }

  /*
   * ========================================
   * USUARIO SIN GRUPO
   * ========================================
   */

  if (!activeGroup) {
    return (
      <GroupSetup
        userId={
          currentUserId
        }
        userName={
          profile.name
        }
        onReady={
          setActiveGroup
        }
        onLogout={
          handleLogout
        }
      />
    )
  }

  /*
   * ========================================
   * CARGANDO GRUPO
   * ========================================
   */

  if (groupLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">
            🔥
          </div>

          <p className="mt-3 font-bold text-violet-500">
            Cargando tu grupo...
          </p>
        </div>
      </main>
    )
  }

  /*
   * ========================================
   * ERROR CARGANDO GRUPO
   * ========================================
   */

  if (groupError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-sm">
          <p className="text-4xl">
            😵
          </p>

          <h1 className="mt-4 text-xl font-black text-zinc-800">
            No pudimos cargar tu Racha
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {groupError}
          </p>

          <button
            onClick={
              handleLogout
            }
            className="mt-5 rounded-2xl bg-violet-500 px-5 py-3 font-bold text-white"
          >
            Salir
          </button>
        </div>
      </main>
    )
  }

  /*
   * ========================================
   * APLICACIÓN PRINCIPAL
   * ========================================
   */

  return (
    <main className="min-h-screen pb-28">
      {/* ================================= */}
      {/* HEADER DEL GRUPO */}
      {/* ================================= */}

      <div className="mx-auto w-full max-w-md px-5 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-wider text-zinc-400">
              TU RACHA
            </p>

            <p className="truncate font-black text-zinc-800">
              🔥 {activeGroup.name}
            </p>
          </div>

          <button
            onClick={
              copyInviteCode
            }
            title="Copiar código"
            className="ml-3 flex shrink-0 items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-600"
          >
            <Copy
              size={14}
            />

            {
              activeGroup.invite_code
            }
          </button>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            onClick={
              handleLogout
            }
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 transition hover:text-red-400"
          >
            <LogOut
              size={13}
            />

            Salir
          </button>
        </div>
      </div>

      {/* ================================= */}
      {/* INICIO */}
      {/* ================================= */}

      {view === 'home' && (
        <Home
          activities={
            activities
          }
          users={
            users
          }
          currentUserId={
            currentUserId
          }
          today={
            today
          }
          onSelectDate={
            setSelectedDate
          }
          onAddActivity={() =>
            openActivityModal(
              todayKey,
            )
          }
        />
      )}

      {/* ================================= */}
      {/* CALENDARIO */}
      {/* ================================= */}

      {view ===
        'calendar' && (
        <Calendar
          activities={
            activities
          }
          users={
            users
          }
          currentUserId={
            currentUserId
          }
          today={
            today
          }
          onSelectDate={
            setSelectedDate
          }
          onBack={() =>
            setView('home')
          }
        />
      )}

      {/* ================================= */}
      {/* RACHAS */}
      {/* ================================= */}

      {view ===
        'rachas' && (
        <Rachas
          activities={
            activities
          }
          users={
            users
          }
          currentUserId={
            currentUserId
          }
          today={
            today
          }
        />
      )}

      {/* ================================= */}
      {/* PERFIL */}
      {/* ================================= */}

      {view ===
        'profile' &&
        currentUser && (
          <Perfil
            currentUser={
              currentUser
            }
            profile={
              profile
            }
            email={
              session.user.email ??
              ''
            }
            group={
              activeGroup
            }
            memberCount={
              users.length
            }
            onLogout={
              handleLogout
            }
            onSaveProfile={
              saveProfile
            }
          />
        )}

      {/* ================================= */}
      {/* BARRA INFERIOR */}
      {/* ================================= */}

      <BottomNavigation
        view={
          view
        }
        onChangeView={
          setView
        }
        onAddActivity={() =>
          openActivityModal(
            todayKey,
          )
        }
      />

      {/* ================================= */}
      {/* DETALLE DEL DÍA */}
      {/* ================================= */}

      <DayDetailModal
        dateKey={
          selectedDate
        }
        todayKey={
          todayKey
        }
        activities={
          activities
        }
        users={
          users
        }
        currentUserId={
          currentUserId
        }
        onClose={() =>
          setSelectedDate(
            null,
          )
        }
        onEditActivity={
          openActivityModal
        }
      />

      {/* ================================= */}
      {/* MODAL DE ACTIVIDAD */}
      {/* ================================= */}

      <ActivityModal
        open={
          activityModalOpen
        }
        activity={
          currentEditingActivity
        }
        onClose={
          closeActivityModal
        }
        onSave={
          saveActivity
        }
        onDelete={
          deleteActivity
        }
      />
    </main>
  )
}

export default RachaApp