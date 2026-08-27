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
import GroupSwitcher from './components/GroupSwitcher'
import Onboarding from './pages/Onboarding'
import Calendar from './pages/Calendar'
import GroupSetup from './pages/GroupSetup'
import Home from './pages/Home'
import Perfil from './pages/Perfil'
import Rachas from './pages/Rachas'
import InviteJoin from './pages/InviteJoin'

import {
  supabase,
} from './lib/supabase'

import {
  formatDateKey,
} from './utils/date'

import type {
  ActivitiesByDate,
  Activity,
  ActivityReaction,
  ActivityType,
  Group,
  Profile,
  ReactionEmoji,
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

type ReactionRow = {
  user_id: string
  emoji: string
}

type ActivityRow = {
  id: string
  user_id: string
  activity_date: string
  type: string
  duration: number
  reactions: ReactionRow[] | null
}

const avatarColors = [
  'bg-violet-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-orange-500',
]

const sleep = (
  milliseconds: number,
) =>
  new Promise<void>(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds,
      )
    },
  )

function isJwtIssuedAtFuture(
  error:
    | {
        code?: string
        message?: string
      }
    | null
    | undefined,
) {
  if (!error) {
    return false
  }

  return (
    error.code ===
      'PGRST303' ||
    error.message
      ?.toLowerCase()
      .includes(
        'jwt issued at future',
      ) === true
  )
}

async function loadAccountWithRetry(
  userId: string,
) {
  const delays = [
    0,
    1500,
    3000,
  ]

  for (
    let attempt = 0;
    attempt < delays.length;
    attempt += 1
  ) {
    const delay =
      delays[attempt]

    if (delay > 0) {
      console.warn(
        `Supabase JWT todavía no válido. Reintentando en ${delay}ms...`,
      )

      await sleep(delay)
    }

    const [
      profileResult,
      groupsResult,
    ] =
      await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, name, avatar_url, onboarding_completed',
          )
          .eq(
            'id',
            userId,
          )
          .single(),

        supabase
          .from('groups')
          .select(
            'id, name, invite_code, created_by',
          )
          .order(
            'created_at',
            {
              ascending: true,
            },
          ),
      ])

    const profileJwtError =
      isJwtIssuedAtFuture(
        profileResult.error,
      )

    const groupsJwtError =
      isJwtIssuedAtFuture(
        groupsResult.error,
      )

    if (
      !profileJwtError &&
      !groupsJwtError
    ) {
      return {
        profileResult,
        groupsResult,
      }
    }

    if (
      attempt ===
      delays.length - 1
    ) {
      return {
        profileResult,
        groupsResult,
      }
    }
  }

  const [
    profileResult,
    groupsResult,
  ] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, name, avatar_url, onboarding_completed',
        )
        .eq(
          'id',
          userId,
        )
        .single(),

      supabase
        .from('groups')
        .select(
          'id, name, invite_code, created_by',
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        ),
    ])

  return {
    profileResult,
    groupsResult,
  }
}

function RachaApp({
  session,
}: Props) {
  const today =
    useMemo(
      () => new Date(),
      [],
    )

  const todayKey =
    formatDateKey(today)

  const currentUserId =
    session.user.id

  const activeGroupStorageKey =
    `racha-active-group-${currentUserId}`

    const [
  pendingInviteCode,
  setPendingInviteCode,
] =
  useState<string | null>(
    () => {
      const params =
        new URLSearchParams(
          window.location.search,
        )

      const code =
        params
          .get('join')
          ?.trim()
          .toUpperCase()

      return code || null
    },
  )

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
   * GRUPOS
   * ========================================
   */

  const [
    groups,
    setGroups,
  ] =
    useState<Group[]>([])

  const [
    activeGroup,
    setActiveGroup,
  ] =
    useState<Group | null>(
      null,
    )

  /*
   * ========================================
   * CUENTA
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
   * USUARIOS
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
   * ESTADO DEL GRUPO
   * ========================================
   */

  const [
    groupLoading,
    setGroupLoading,
  ] =
    useState(false)

  

    const [
  groupRefreshKey,
  setGroupRefreshKey,
] =
  useState(0)

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
   * ACTIVIDAD EN EDICIÓN
   * ========================================
   */

  const [
    editingDate,
    setEditingDate,
  ] =
    useState(todayKey)

  const [
    editingActivityId,
    setEditingActivityId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    activityModalOpen,
    setActivityModalOpen,
  ] =
    useState(false)

  /*
   * ========================================
   * PERFIL + TODOS LOS GRUPOS
   * ========================================
   */

  useEffect(() => {
    let cancelled = false

    const loadAccount =
      async () => {
        setAccountLoading(
          true,
        )

        setAccountError(
          null,
        )

        const {
          profileResult,
          groupsResult,
        } =
          await loadAccountWithRetry(
            currentUserId,
          )

        if (cancelled) {
          return
        }

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

        setProfile(
          profileResult.data as Profile,
        )

        const loadedGroups =
          (
            groupsResult.data ??
            []
          ) as Group[]

        setGroups(
          loadedGroups,
        )

        /*
         * Intentamos recuperar
         * el último grupo utilizado.
         */

        const savedGroupId =
          window.localStorage.getItem(
            activeGroupStorageKey,
          )

        const savedGroup =
          loadedGroups.find(
            (group) =>
              group.id ===
              savedGroupId,
          )

        const groupToActivate =
          savedGroup ??
          loadedGroups[0] ??
          null

        setActiveGroup(
          groupToActivate,
        )

        if (groupToActivate) {
          window.localStorage.setItem(
            activeGroupStorageKey,
            groupToActivate.id,
          )
        }

        setAccountLoading(
          false,
        )
      }

    void loadAccount()

    return () => {
      cancelled = true
    }
  }, [
    currentUserId,
    activeGroupStorageKey,
  ])

  /*
   * ========================================
   * CAMBIAR GRUPO
   * ========================================
   */

  const selectGroup = (
    group: Group,
  ) => {
    if (
      activeGroup?.id ===
      group.id
    ) {
      return
    }

    /*
     * Cerramos cualquier interacción
     * perteneciente al grupo anterior.
     */

    setSelectedDate(null)

    setActivityModalOpen(
      false,
    )

    setEditingActivityId(
      null,
    )

    setGroupError(null)

    /*
     * Limpiamos mientras carga
     * el nuevo grupo para no mostrar
     * datos viejos ni por un instante.
     */

    setUsers([])
    setActivities({})

    setActiveGroup(group)

    window.localStorage.setItem(
      activeGroupStorageKey,
      group.id,
    )
  }

  /*
 * ========================================
 * GRUPO CREADO / UNIDO
 * ========================================
 */

const handleGroupReady = (
  group: Group,
) => {
  setGroups(
    (currentGroups) => {
      const alreadyExists =
        currentGroups.some(
          (currentGroup) =>
            currentGroup.id ===
            group.id,
        )

      if (alreadyExists) {
        return currentGroups.map(
          (currentGroup) =>
            currentGroup.id ===
            group.id
              ? group
              : currentGroup,
        )
      }

      return [
        ...currentGroups,
        group,
      ]
    },
  )

  setActiveGroup(group)

  window.localStorage.setItem(
    activeGroupStorageKey,
    group.id,
  )
}

/*
 * ========================================
 * LIMPIAR INVITACIÓN DEL LINK
 * ========================================
 */

const clearInviteLink =
  () => {
    const url =
      new URL(
        window.location.href,
      )

    url.searchParams.delete(
      'join',
    )

    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`,
    )

    setPendingInviteCode(
      null,
    )
  }

/*
 * ========================================
 * GRUPO ACTUALIZADO
 * ========================================
 */

const handleGroupUpdated = (
  updatedGroup: Group,
) => {
  setGroups(
    (currentGroups) =>
      currentGroups.map(
        (group) =>
          group.id ===
          updatedGroup.id
            ? updatedGroup
            : group,
      ),
  )

  setActiveGroup(
    (currentGroup) =>
      currentGroup?.id ===
      updatedGroup.id
        ? updatedGroup
        : currentGroup,
  )
}

/*
 * ========================================
 * ABANDONAR GRUPO
 * ========================================
 */

const handleLeftGroup = (
  groupId: string,
) => {
  const remainingGroups =
    groups.filter(
      (group) =>
        group.id !== groupId,
    )

  setGroups(
    remainingGroups,
  )

  const nextGroup =
    remainingGroups[0] ??
    null

  setActiveGroup(
    nextGroup,
  )

  if (nextGroup) {
    window.localStorage.setItem(
      activeGroupStorageKey,
      nextGroup.id,
    )
  } else {
    window.localStorage.removeItem(
      activeGroupStorageKey,
    )
  }

  setUsers([])
  setActivities({})
  setSelectedDate(null)
}

/*
 * ========================================
 * MIEMBRO EXPULSADO
 * ========================================
 */

const handleMemberRemoved = (
  userId: string,
) => {
  setUsers(
    (currentUsers) =>
      currentUsers.filter(
        (user) =>
          user.id !== userId,
      ),
  )

  setActivities(
    (currentActivities) => {
      const nextActivities:
        ActivitiesByDate = {}

      Object.entries(
        currentActivities,
      ).forEach(
        ([
          dateKey,
          day,
        ]) => {
          const nextDay = {
            ...day,
          }

          delete nextDay[
            userId
          ]

          if (
            Object.keys(
              nextDay,
            ).length > 0
          ) {
            nextActivities[
              dateKey
            ] = nextDay
          }
        },
      )

      return nextActivities
    },
  )
}

/*
 * ========================================
 * LOADING AL CAMBIAR DE GRUPO
 * ========================================
 */

useEffect(() => {
  if (!activeGroup) {
    return
  }

  setGroupLoading(true)
}, [
  activeGroup?.id,
])
  /*
   * ========================================
   * MIEMBROS + ACTIVIDADES + REACCIONES
   * ========================================
   */

  useEffect(() => {
   if (!activeGroup) {
 

  setUsers([])
  setActivities({})

  return
}

    let cancelled = false

   const loadGroupData =
  async () => {
    const isInitialLoad =
      
      activeGroup.id

    if (isInitialLoad) {
      
    }

    setGroupError(
      null,
    )

        const [
          membersResult,
          activitiesResult,
        ] =
          await Promise.all([
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

            supabase
              .from(
                'activities',
              )
              .select(`
                id,
                user_id,
                activity_date,
                type,
                duration,
                reactions:activity_reactions (
                  user_id,
                  emoji
                )
              `)
              .eq(
                'group_id',
                activeGroup.id,
              )
              .order(
                'created_at',
                {
                  ascending: true,
                },
              ),
          ])

        if (cancelled) {
          return
        }

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
         * USERS
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

        /*
         * ACTIVITIES
         */

        const activityRows =
          (
            activitiesResult.data ??
            []
          ) as unknown as ActivityRow[]

        const activityMap:
          ActivitiesByDate = {}

        activityRows.forEach(
          (row) => {
            if (
              !activityMap[
                row.activity_date
              ]
            ) {
              activityMap[
                row.activity_date
              ] = {}
            }

            if (
              !activityMap[
                row.activity_date
              ][row.user_id]
            ) {
              activityMap[
                row.activity_date
              ][row.user_id] = []
            }

            const reactions:
              ActivityReaction[] =
                (
                  row.reactions ??
                  []
                ).map(
                  (
                    reaction,
                  ) => ({
                    user_id:
                      reaction.user_id,

                    emoji:
                      reaction.emoji as ReactionEmoji,
                  }),
                )

            activityMap[
              row.activity_date
            ][row.user_id].push({
              id: row.id,

              type:
                row.type as ActivityType,

              duration:
                row.duration,

              reactions,
            })
          },
        )

        if (cancelled) {
          return
        }

        setUsers(
          loadedUsers,
        )

        setActivities(
          activityMap,
        )

        setGroupLoading(
          false,
        )
      }

    void loadGroupData()

    return () => {
      cancelled = true
    }
  
    }, [
  activeGroup?.id,
  currentUserId,
  groupRefreshKey,
])

/*
 * ========================================
 * REALTIME DEL GRUPO
 * ========================================
 */

useEffect(() => {
  if (!activeGroup) {
    return
  }

  const refreshGroup =
    () => {
      setGroupRefreshKey(
        (current) =>
          current + 1,
      )
    }

  const channel =
    supabase
      .channel(
        `racha-group-${activeGroup.id}`,
      )

      /*
       * ACTIVIDADES
       */

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter:
            `group_id=eq.${activeGroup.id}`,
        },
        () => {
          refreshGroup()
        },
      )

      /*
       * MIEMBROS
       */

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table:
            'group_members',
        },
        () => {
          refreshGroup()
        },
      )

      /*
       * REACCIONES
       */

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table:
            'activity_reactions',
        },
        () => {
          refreshGroup()
        },
      )

      .subscribe(
        (status) => {
          if (
            status ===
            'SUBSCRIBED'
          ) {
            console.log(
              'Racha Realtime conectado:',
              activeGroup.name,
            )
          }
        },
      )

  return () => {
    void supabase.removeChannel(
      channel,
    )
  }
}, [
  activeGroup?.id,
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
   * MODAL DE ACTIVIDAD
   * ========================================
   */

  const openActivityModal = (
    dateKey = todayKey,
    activityId:
      string | null = null,
  ) => {
    setSelectedDate(null)

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

  const closeActivityModal =
    () => {
      setActivityModalOpen(
        false,
      )

      setEditingActivityId(
        null,
      )
    }

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
   */

  const saveActivity =
    async (
      activity: Activity,
    ) => {
      if (!activeGroup) {
        return
      }

      /*
       * EDITAR
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

                [currentUserId]:
                  userActivities.map(
                    (
                      currentActivity,
                    ) =>
                      currentActivity.id ===
                      editingActivityId
                        ? {
                            ...currentActivity,

                            id:
                              data.id,

                            type:
                              data.type as ActivityType,

                            duration:
                              data.duration,
                          }
                        : currentActivity,
                  ),
              },
            }
          },
        )

        closeActivityModal()

        return
      }

      /*
       * NUEVA
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

      const newActivity:
        Activity = {
          id: data.id,

          type:
            data.type as ActivityType,

          duration:
            data.duration,

          reactions: [],
        }

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

      setActivities(
        (
          currentActivities,
        ) => {
          const copy = {
            ...currentActivities,
          }

          const currentDay = {
            ...(
              copy[
                editingDate
              ] ?? {}
            ),
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

          if (
            remainingActivities.length >
            0
          ) {
            currentDay[
              currentUserId
            ] =
              remainingActivities
          } else {
            delete currentDay[
              currentUserId
            ]
          }

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
   * REACCIONES
   * ========================================
   */

  const updateReactionInState = (
    activityId: string,
    reactions:
      ActivityReaction[],
  ) => {
    setActivities(
      (
        currentActivities,
      ) => {
        const nextActivities:
          ActivitiesByDate = {}

        Object.entries(
          currentActivities,
        ).forEach(
          ([
            dateKey,
            day,
          ]) => {
            nextActivities[
              dateKey
            ] = {}

            Object.entries(
              day,
            ).forEach(
              ([
                userId,
                userActivities,
              ]) => {
                nextActivities[
                  dateKey
                ][userId] =
                  userActivities.map(
                    (activity) =>
                      activity.id ===
                      activityId
                        ? {
                            ...activity,
                            reactions,
                          }
                        : activity,
                  )
              },
            )
          },
        )

        return nextActivities
      },
    )
  }

  const reactToActivity =
    async (
      activityId: string,
      emoji: ReactionEmoji,
    ) => {
      let targetActivity:
        Activity | null = null

      for (
        const day of
        Object.values(
          activities,
        )
      ) {
        for (
          const userActivities of
          Object.values(day)
        ) {
          const found =
            userActivities.find(
              (activity) =>
                activity.id ===
                activityId,
            )

          if (found) {
            targetActivity =
              found

            break
          }
        }

        if (targetActivity) {
          break
        }
      }

      if (!targetActivity) {
        return
      }

      const currentReactions =
        targetActivity.reactions ??
        []

      const myReaction =
        currentReactions.find(
          (reaction) =>
            reaction.user_id ===
            currentUserId,
        )

      /*
       * MISMA REACCIÓN:
       * LA QUITAMOS
       */

      if (
        myReaction?.emoji ===
        emoji
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'activity_reactions',
            )
            .delete()
            .eq(
              'activity_id',
              activityId,
            )
            .eq(
              'user_id',
              currentUserId,
            )

        if (error) {
          console.error(
            'Error eliminando reacción:',
            error,
          )

          window.alert(
            'No pudimos sacar la reacción.',
          )

          return
        }

        const newReactions =
          currentReactions.filter(
            (reaction) =>
              reaction.user_id !==
              currentUserId,
          )

        updateReactionInState(
          activityId,
          newReactions,
        )

        return
      }

      /*
       * NUEVA O CAMBIO
       */

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'activity_reactions',
          )
          .upsert(
            {
              activity_id:
                activityId,

              user_id:
                currentUserId,

              emoji,
            },
            {
              onConflict:
                'activity_id,user_id',
            },
          )
          .select(
            'user_id, emoji',
          )
          .single()

      if (
        error ||
        !data
      ) {
        console.error(
          'Error guardando reacción:',
          error,
        )

        window.alert(
          'No pudimos guardar la reacción.',
        )

        return
      }

      const newReaction:
        ActivityReaction = {
          user_id:
            data.user_id,

          emoji:
            data.emoji as ReactionEmoji,
        }

      const newReactions = [
        ...currentReactions.filter(
          (reaction) =>
            reaction.user_id !==
            currentUserId,
        ),

        newReaction,
      ]

      updateReactionInState(
        activityId,
        newReactions,
      )
    }

  /*
   * ========================================
   * PERFIL
   * ========================================
   */

  const saveProfile =
    async (
      name: string,
      avatarUrl:
        string | null,
      avatarFile:
        File | null,
    ) => {
      let finalAvatarUrl =
        avatarUrl

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

        if (uploadError) {
          console.error(
            'Error subiendo avatar:',
            uploadError,
          )

          window.alert(
            'No pudimos subir tu dibu.',
          )

          return false
        }

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from('avatars')
            .getPublicUrl(
              avatarPath,
            )

        finalAvatarUrl =
          `${
            publicUrlData.publicUrl
          }?v=${Date.now()}`
      }

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
            'id, name, avatar_url, onboarding_completed',
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

      setProfile(
        updatedProfile,
      )

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
 * COMPLETAR ONBOARDING
 * ========================================
 */

const completeOnboarding =
  async () => {
    const {
      error,
    } =
      await supabase
        .from('profiles')
        .update({
          onboarding_completed:
            true,
        })
        .eq(
          'id',
          currentUserId,
        )

    if (error) {
      console.error(
        'Error completando onboarding:',
        error,
      )

      window.alert(
        'No pudimos terminar la introducción. Probá nuevamente.',
      )

      return
    }

    setProfile(
      (currentProfile) => {
        if (!currentProfile) {
          return currentProfile
        }

        return {
          ...currentProfile,
          onboarding_completed:
            true,
        }
      },
    )
  }

  /*
   * ========================================
   * LOGOUT
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
   * COPIAR CÓDIGO
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
          'No se pudo copiar:',
          error,
        )
      }
    }

  /*
   * ========================================
   * LOADING
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
   * ERROR CUENTA
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
            type="button"
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
 * ONBOARDING
 * ========================================
 */

if (
  !profile.onboarding_completed
) {
  return (
    <Onboarding
      onComplete={
        completeOnboarding
      }
    />
  )
}

/*
 * ========================================
 * INVITACIÓN POR LINK
 * ========================================
 */

if (pendingInviteCode) {
  const existingInvitedGroup =
    groups.find(
      (group) =>
        group.invite_code
          .toUpperCase() ===
        pendingInviteCode,
    ) ?? null

  return (
    <InviteJoin
      inviteCode={
        pendingInviteCode
      }
      existingGroup={
        existingInvitedGroup
      }
      onReady={(
        group,
      ) => {
        handleGroupReady(
          group,
        )

        clearInviteLink()
      }}
      onCancel={
        clearInviteLink
      }
    />
  )
}

  /*
   * ========================================
   * SIN GRUPO
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
          handleGroupReady
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
            Cargando{' '}
            {activeGroup.name}...
          </p>
        </div>
      </main>
    )
  }

  /*
   * ========================================
   * ERROR GRUPO
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
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-2xl bg-violet-500 px-5 py-3 font-bold text-white"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

  /*
   * ========================================
   * APP
   * ========================================
   */

  return (
    <main className="min-h-screen pb-28">
      {/* HEADER */}

      <div className="mx-auto w-full max-w-md px-5 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          <GroupSwitcher
            groups={
              groups
            }
            activeGroup={
              activeGroup
            }
            onSelectGroup={
              selectGroup
            }
          />

          <button
            type="button"
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

        {groups.length > 1 && (
          <p className="mt-2 text-left text-[11px] font-semibold text-zinc-400">
            Tenés{' '}
            {groups.length}{' '}
            grupos · tocá el nombre
            para cambiar
          </p>
        )}

        <div className="mt-2 flex justify-end">
          <button
            type="button"
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

      {/* HOME */}

      {view ===
        'home' && (
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

      {/* CALENDAR */}

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
            setView(
              'home',
            )
          }
        />
      )}

      {/* RACHAS */}

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

      {/* PERFIL */}

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
        session.user
          .email ?? ''
      }
      group={
        activeGroup
      }
      members={
        users
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
      onGroupReady={
        handleGroupReady
      }
      onGroupUpdated={
        handleGroupUpdated
      }
      onLeftGroup={
        handleLeftGroup
      }
      onMemberRemoved={
        handleMemberRemoved
      }
    />
        )}

      {/* NAV */}

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

      {/* DETALLE */}

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
        onReactActivity={
          reactToActivity
        }
      />

      {/* ACTIVIDAD */}

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