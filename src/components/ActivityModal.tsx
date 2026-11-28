import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  MOODS,
  NOTE_MAX_LENGTH,
} from '../lib/moods'

import {
  isCustomSportSupported,
  isMoodSupported,
} from '../lib/groupData'

import {
  useSwipeToClose,
} from '../hooks/useSwipeToClose'

import {
  Camera,
  Plus,
  LoaderCircle,
  Trash2,
  X,
} from 'lucide-react'

import {
  activityOptions,
  CUSTOM_SPORT_EMOJIS,
  CUSTOM_SPORT_MAX_LENGTH,
  getActivityEmoji,
  isBuiltInType,
  registerCustomSport,
} from '../data/activities'

import {
  monthNames,
  parseDateKey,
} from '../utils/date'

import type {
  Activity,
  ActivityType,
  PhotoChange,
  Mood,
} from '../types'

const MAX_PHOTO_MB = 15

type Props = {
  open: boolean

  activity?: Activity

  dateKey: string
  todayKey: string

  usesWildcard: boolean

  wildcardBalance:
    number | null

  onClose: () => void

  onSave: (
    activity: Activity,
    photo: PhotoChange,
  ) => void | Promise<void>

  onDelete:
    () => void | Promise<void>

  /*
   * Última actividad propia, para
   * repetirla con un toque.
   */
  lastActivity?: Activity | null

  /*
   * Deportes propios de la persona (más
   * recientes primero).
   */
  customSports?: CustomSport[]

  /*
   * Los deportes que más usa la persona
   * (los primeros 6 se muestran a mano).
   */
  favoriteSports?: ActivityType[]
}

const DURATION_SHORTCUTS = [
  30,
  45,
  60,
  90,
]

const DEFAULT_QUICK_SPORTS: ActivityType[] = [
  'Gym',
  'Caminata',
  'Correr',
  'Bicicleta',
  'Fútbol',
  'Funcional',
]

export type CustomSport = {
  name: string
  emoji: string
}

function ActivityModal({
  open,
  activity,
  dateKey,
  todayKey,
  usesWildcard,
  wildcardBalance,
  onClose,
  onSave,
  onDelete,
  lastActivity = null,
  customSports = [],
  favoriteSports = [],
}: Props) {
  const sheetRef =
    useSwipeToClose(onClose)

  /*
   * ========================================
   * ACTIVIDAD
   * ========================================
   */

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<ActivityType>(
      activity?.type ??
        'Gym',
    )

  /*
   * ========================================
   * DURACIÓN
   * ========================================
   */

  const [
    duration,
    setDuration,
  ] =
    useState(
      activity?.duration ??
        60,
    )

  /*
   * ========================================
   * ESTADOS
   * ========================================
   */

  /*
   * ========================================
   * CÓMO TE SENTISTE (OPCIONAL)
   * ========================================
   */

  const [mood, setMood] =
    useState<Mood | null>(
      activity?.mood ?? null,
    )

  const [note, setNote] = useState(
    activity?.note ?? '',
  )

  /*
   * Deporte propio nuevo (al elegir "Otra").
   */
  const [customName, setCustomName] =
    useState('')

  const [customEmoji, setCustomEmoji] =
    useState(CUSTOM_SPORT_EMOJIS[0])

  /*
   * Lo que se ve de entrada es lo mínimo:
   * 6 deportes, atajos de duración y
   * guardar. El resto se abre si se pide.
   */
  const [showAllSports, setShowAllSports] =
    useState(false)

  const [customDuration, setCustomDuration] =
    useState(false)

  const [showDetails, setShowDetails] =
    useState(false)

  /*
   * ========================================
   * FOTO
   * ========================================
   */

  const [
    photoFile,
    setPhotoFile,
  ] =
    useState<File | null>(null)

  const [
    photoRemoved,
    setPhotoRemoved,
  ] =
    useState(false)

  const newPhotoPreview = useMemo(
    () =>
      photoFile
        ? URL.createObjectURL(photoFile)
        : null,
    [photoFile],
  )

  useEffect(
    () => () => {
      if (newPhotoPreview) {
        URL.revokeObjectURL(
          newPhotoPreview,
        )
      }
    },
    [newPhotoPreview],
  )

  const photoPreview =
    newPhotoPreview ??
    (photoRemoved
      ? null
      : (activity?.photo_url ?? null))

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    deleting,
    setDeleting,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  /*
   * ========================================
   * TIPO DE FLUJO
   * ========================================
   */

  const isEditing =
    Boolean(
      activity?.id,
    )

  /*
   * Lista de la grilla: los de siempre, tus
   * deportes propios y al final "Otra".
   */
  const ownSports = [...customSports]

  if (
    activity?.type &&
    !isBuiltInType(activity.type) &&
    !ownSports.some(
      (sport) =>
        sport.name === activity.type,
    )
  ) {
    ownSports.unshift({
      name: activity.type,
      emoji: getActivityEmoji(
        activity.type,
      ),
    })
  }

  const sportOptions: {
    name: ActivityType
    emoji: string
    custom?: boolean
  }[] = [
    ...activityOptions.filter(
      (option) => option.name !== 'Otra',
    ),
    ...ownSports.map((sport) => ({
      ...sport,
      custom: true,
    })),
    ...activityOptions.filter(
      (option) => option.name === 'Otra',
    ),
  ]

  /*
   * Los 6 de siempre de esta persona (o los
   * más comunes si recién arranca). Si el
   * elegido no está entre ellos, se suma.
   */
  const quickNames = [
    ...favoriteSports,
    ...DEFAULT_QUICK_SPORTS,
  ].filter(
    (name, index, all) =>
      all.indexOf(name) === index &&
      sportOptions.some(
        (option) => option.name === name,
      ),
  ).slice(0, 6)

  if (
    selectedType &&
    !quickNames.includes(selectedType)
  ) {
    quickNames[quickNames.length - 1] =
      selectedType
  }

  const quickSports = quickNames
    .map((name) =>
      sportOptions.find(
        (option) => option.name === name,
      ),
    )
    .filter(
      (option): option is (typeof sportOptions)[number] =>
        Boolean(option),
    )

  const isPastDay =
    dateKey <
    todayKey

  const date =
    parseDateKey(
      dateKey,
    )

  const formattedDate =
    `${date.getDate()} de ${
      monthNames[
        date.getMonth()
      ]
    }`

  /*
   * ========================================
   * RESET
   * ========================================
   */

  useEffect(() => {
    if (!open) {
      return
    }

    /*
     * Al cargar algo nuevo se propone lo de
     * la última vez: deporte y duración.
     */
    const initialDuration =
      activity?.duration ??
      lastActivity?.duration ??
      45

    setSelectedType(
      activity?.type ??
        lastActivity?.type ??
        favoriteSports[0] ??
        'Gym',
    )

    setDuration(initialDuration)

    setCustomDuration(
      !DURATION_SHORTCUTS.includes(
        initialDuration,
      ),
    )

    setShowAllSports(false)

    setShowDetails(
      Boolean(
        activity?.mood ||
          activity?.note ||
          activity?.photo_url,
      ),
    )

    setMood(activity?.mood ?? null)
    setNote(activity?.note ?? '')
    setCustomName('')
    setCustomEmoji(
      CUSTOM_SPORT_EMOJIS[0],
    )
    setSaving(false)
    setDeleting(false)
    setError(null)
    setPhotoFile(null)
    setPhotoRemoved(false)
    // Solo al abrir: si cambian los
    // favoritos con la ventana abierta, no
    // se pisa lo que eligió la persona.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    activity,
  ])

  /*
   * ========================================
   * CERRAR
   * ========================================
   */

  const handleClose =
    () => {
      if (
        saving ||
        deleting
      ) {
        return
      }

      onClose()
    }

  /*
   * ========================================
   * GUARDAR
   * ========================================
   */

  const handleSave =
    async (
      type: ActivityType = selectedType,
      minutes: number = duration,
    ) => {
      setError(
        null,
      )

      if (
        minutes <= 0
      ) {
        setError(
          'La duración tiene que ser mayor a 0 minutos.',
        )

        return
      }

      if (
        minutes > 1440
      ) {
        setError(
          'Che, más de 24 horas ya es medio sospechoso jajaj.',
        )

        return
      }

      /*
       * "Otra" con nombre = deporte propio.
       * Si el nombre coincide con uno de la
       * lista, se usa ese.
       */
      let finalType: ActivityType = type

      const typedName = customName
        .trim()
        .replace(/\s+/g, ' ')
        .slice(
          0,
          CUSTOM_SPORT_MAX_LENGTH,
        )

      if (
        type === 'Otra' &&
        typedName
      ) {
        const builtIn =
          activityOptions.find(
            (option) =>
              option.name.toLowerCase() ===
              typedName.toLowerCase(),
          )

        if (builtIn) {
          finalType = builtIn.name
        } else {
          const existing =
            customSports.find(
              (sport) =>
                sport.name.toLowerCase() ===
                typedName.toLowerCase(),
            )

          finalType =
            existing?.name ?? typedName

          registerCustomSport(
            finalType,
            existing?.emoji ?? customEmoji,
          )
        }
      }

      setSaving(
        true,
      )

      const photo: PhotoChange =
        photoFile
          ? {
              kind: 'replace',
              file: photoFile,
            }
          : photoRemoved
            ? { kind: 'remove' }
            : { kind: 'keep' }

      try {
        await onSave(
          {
            id:
              activity?.id,

            type: finalType,

            duration: minutes,

            mood,

            note:
              note.trim() || null,
          },
          photo,
        )

        /*
         * Si onSave no cierra
         * por algún error controlado,
         * permitimos volver a tocar.
         */
        setSaving(
          false,
        )
      } catch (
        saveError
      ) {
        console.error(
          'Error guardando actividad:',
          saveError,
        )

        setError(
          'No pudimos guardar la actividad.',
        )

        setSaving(
          false,
        )
      }
    }

  /*
   * ========================================
   * ELIMINAR
   * ========================================
   */

  const handleDelete =
    async () => {
      if (
        !isEditing
      ) {
        return
      }

      /*
       * Sin "¿Estás seguro?": se borra al
       * toque y aparece "Deshacer".
       */

      setError(
        null,
      )

      setDeleting(
        true,
      )

      try {
        await onDelete()
      } catch (
        deleteError
      ) {
        console.error(
          'Error eliminando actividad:',
          deleteError,
        )

        setError(
          'No pudimos eliminar la actividad.',
        )

        setDeleting(
          false,
        )
      }
    }

  /*
   * ========================================
   * CERRADO
   * ========================================
   */

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-[2px]">
      <div ref={sheetRef} className="max-h-[calc(100dvh-20px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[34px] bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 shadow-2xl">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="sticky top-0 z-20 -mx-5 mb-5 flex items-start justify-between bg-white px-5 pb-3">
          <div>
            <p
              className={`text-sm font-bold ${
                usesWildcard
                  ? 'text-amber-600'
                  : 'text-violet-500'
              }`}
            >
              {isEditing
                ? 'Editar'
                : usesWildcard
                  ? '🃏 Recuperar día'
                  : isPastDay
                    ? 'Agregar actividad'
                    : 'Sumar actividad'}
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              {isEditing
                ? '¿Qué hiciste?'
                : usesWildcard ||
                    isPastDay
                  ? '¿Qué hiciste ese día?'
                  : '¿Qué hiciste hoy?'}
            </h2>

            {(usesWildcard ||
              isPastDay) && (
              <p className="mt-1 text-sm text-zinc-500">
                {formattedDate}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              saving ||
              deleting
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition active:scale-95 disabled:opacity-50"
          >
            <X
              size={20}
            />
          </button>
        </div>

        {/* ================================= */}
        {/* COMODÍN */}
        {/* ================================= */}

        {usesWildcard && (
          <p className="mb-5 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <span className="text-lg">
              🃏
            </span>
            Usás 1 comodín
            {wildcardBalance !== null &&
              ` · tenés ${wildcardBalance}`}
          </p>
        )}

        {/* ================================= */}
        {/* ACTIVIDAD */}
        {/* ================================= */}

        <section>
          <div className="grid grid-cols-3 gap-2">
            {(showAllSports
              ? sportOptions
              : quickSports
            ).map((option) => {
              const selected =
                selectedType ===
                option.name

              return (
                <button
                  key={option.name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setSelectedType(
                      option.name,
                    )
                  }
                  disabled={
                    saving || deleting
                  }
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl border px-1 py-3 transition active:scale-[0.97] ${
                    selected
                      ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100'
                      : 'border-zinc-100 bg-zinc-50'
                  }`}
                >
                  <span className="text-2xl leading-none">
                    {option.emoji}
                  </span>

                  <span
                    className={`w-full truncate text-center text-sm font-semibold ${
                      selected
                        ? 'text-violet-700'
                        : 'text-zinc-600'
                    }`}
                  >
                    {option.name}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAllSports(
                (current) => !current,
              )
            }
            className="mt-2 w-full rounded-xl py-2 text-sm font-semibold text-violet-600"
          >
            {showAllSports
              ? 'Ver menos'
              : 'Más deportes'}
          </button>

          {/* DEPORTE PROPIO */}

          {selectedType === 'Otra' &&
            isCustomSportSupported() && (
              <div className="mt-3 rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-bold text-amber-700">
                  ¿Qué hiciste? Creá tu
                  deporte (opcional)
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                    {customEmoji}
                  </span>

                  <input
                    type="text"
                    value={customName}
                    maxLength={
                      CUSTOM_SPORT_MAX_LENGTH
                    }
                    disabled={
                      saving || deleting
                    }
                    onChange={(event) =>
                      setCustomName(
                        event.target.value,
                      )
                    }
                    placeholder="Ej: Crossfit, Surf, Remo"
                    className="min-w-0 flex-1 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 outline-none transition placeholder:font-semibold placeholder:text-zinc-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                  />
                </div>

                <div
                  data-no-swipe
                  className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]"
                >
                  {CUSTOM_SPORT_EMOJIS.map(
                    (emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={`Emoji ${emoji}`}
                        aria-pressed={
                          customEmoji ===
                          emoji
                        }
                        onClick={() =>
                          setCustomEmoji(
                            emoji,
                          )
                        }
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition active:scale-95 ${
                          customEmoji ===
                          emoji
                            ? 'bg-amber-400 shadow-sm'
                            : 'bg-white'
                        }`}
                      >
                        {emoji}
                      </button>
                    ),
                  )}
                </div>

                <p className="mt-2 text-xs font-semibold text-amber-700/80">
                  Queda guardado para la
                  próxima vez. Si lo dejás
                  vacío, se guarda como
                  "Otra".
                </p>
              </div>
            )}
        </section>

        {/* ================================= */}
        {/* DURACIÓN */}
        {/* ================================= */}

        <section className="mt-5">
          <p className="mb-2 text-sm font-semibold text-zinc-500">
            ¿Cuánto tiempo?
          </p>

          <div className="grid grid-cols-5 gap-2">
            {DURATION_SHORTCUTS.map(
              (minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={
                    !customDuration &&
                    duration === minutes
                  }
                  onClick={() => {
                    setDuration(minutes)
                    setCustomDuration(false)
                  }}
                  disabled={
                    saving || deleting
                  }
                  className={`rounded-xl py-3 text-sm font-bold transition ${
                    !customDuration &&
                    duration === minutes
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {minutes}′
                </button>
              ),
            )}

            <button
              type="button"
              aria-pressed={customDuration}
              onClick={() =>
                setCustomDuration(true)
              }
              disabled={
                saving || deleting
              }
              className={`rounded-xl py-3 text-sm font-bold transition ${
                customDuration
                  ? 'bg-violet-500 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              Otro
            </button>
          </div>

          {customDuration && (
          <div className="mt-3 rounded-2xl bg-zinc-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setDuration(
                    (
                      current,
                    ) =>
                      Math.max(
                        5,
                        current -
                          5,
                      ),
                  )
                }
                disabled={
                  saving ||
                  deleting
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-violet-600 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                −
              </button>

              <div className="text-center">
                <div className="flex items-end justify-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={
                      duration
                    }
                    onChange={(
                      event,
                    ) => {
                      const value =
                        Number(
                          event
                            .target
                            .value,
                        )

                      setDuration(
                        Number.isNaN(
                          value,
                        )
                          ? 0
                          : value,
                      )
                    }}
                    disabled={
                      saving ||
                      deleting
                    }
                    className="w-24 bg-transparent text-center text-4xl font-black text-zinc-800 outline-none"
                  />

                  <span className="mb-1 font-bold text-zinc-500">
                    min
                  </span>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setDuration(
                    (
                      current,
                    ) =>
                      Math.min(
                        1440,
                        current +
                          5,
                      ),
                  )
                }
                disabled={
                  saving ||
                  deleting
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-violet-600 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                +
              </button>
            </div>

          </div>
          )}
        </section>

        {/* ================================= */}
        {/* DETALLES (OPCIONALES, PLEGADOS) */}
        {/* ================================= */}

        {!showDetails ? (
          <button
            type="button"
            onClick={() =>
              setShowDetails(true)
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 py-3 text-sm font-semibold text-zinc-500"
          >
            <Plus size={16} />
            Agregar detalles
            <span className="text-zinc-500">
              (foto, cómo te sentiste)
            </span>
          </button>
        ) : (
          <>
        {/* ================================= */}
        {/* CÓMO TE SENTISTE (OPCIONAL) */}
        {/* ================================= */}

        {isMoodSupported() && (
          <section className="mt-5">
            <p className="mb-2 text-xs font-bold tracking-wide text-zinc-500">
              ¿CÓMO TE SENTISTE? (OPCIONAL)
            </p>

            <div className="grid grid-cols-4 gap-2">
              {MOODS.map((option) => {
                const selected =
                  mood === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={
                      saving || deleting
                    }
                    onClick={() =>
                      setMood(
                        selected
                          ? null
                          : option.id,
                      )
                    }
                    className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 transition active:scale-95 ${
                      selected
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                        : 'bg-zinc-50 text-zinc-500'
                    }`}
                  >
                    <span className="text-2xl leading-none">
                      {option.emoji}
                    </span>

                    <span className="text-xs font-bold">
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="relative mt-3">
              <input
                type="text"
                value={note}
                maxLength={
                  NOTE_MAX_LENGTH
                }
                disabled={
                  saving || deleting
                }
                onChange={(event) =>
                  setNote(
                    event.target.value,
                  )
                }
                placeholder="Una nota: «primera vez que corro 5 km»"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-4 pr-12 text-sm font-semibold text-zinc-700 outline-none transition placeholder:font-semibold placeholder:text-zinc-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />

              {note.length > 0 && (
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                  {NOTE_MAX_LENGTH -
                    note.length}
                </span>
              )}
            </div>
          </section>
        )}

        {/* ================================= */}
        {/* FOTO (OPCIONAL) */}
        {/* ================================= */}

        <section className="mt-5">
          <p className="mb-2 text-xs font-bold tracking-wide text-zinc-500">
            FOTO (OPCIONAL)
          </p>

          {photoPreview ? (
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={photoPreview}
                alt="Foto de la actividad"
                className="h-48 w-full object-cover"
              />

              <button
                type="button"
                aria-label="Quitar foto"
                disabled={
                  saving || deleting
                }
                onClick={() => {
                  setPhotoFile(null)
                  setPhotoRemoved(true)
                }}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 py-4 text-sm font-bold text-zinc-500 transition hover:border-violet-300 hover:text-violet-500 ${
                saving || deleting
                  ? 'pointer-events-none opacity-50'
                  : ''
              }`}
            >
              <Camera size={18} />
              Sumar una foto

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0]

                  event.target.value = ''

                  if (!file) {
                    return
                  }

                  if (
                    file.size >
                    MAX_PHOTO_MB *
                      1024 *
                      1024
                  ) {
                    setError(
                      `La foto pesa más de ${MAX_PHOTO_MB} MB.`,
                    )

                    return
                  }

                  setError(null)
                  setPhotoFile(file)
                }}
              />
            </label>
          )}
        </section>

          </>
        )}

        {/* ================================= */}
        {/* ERROR */}
        {/* ================================= */}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        {/* ================================= */}
        {/* GUARDAR */}
        {/* ================================= */}

        <button
          type="button"
          onClick={() =>
            void handleSave()
          }
          disabled={
            saving ||
            deleting ||
            duration <= 0
          }
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white transition active:scale-[0.98] disabled:opacity-50 ${
            usesWildcard
              ? 'bg-amber-500 shadow-lg shadow-amber-100'
              : 'bg-violet-500 shadow-lg shadow-violet-200'
          }`}
        >
          {saving ? (
            <>
              <LoaderCircle
                size={20}
                className="animate-spin"
              />

              Guardando...
            </>
          ) : isEditing ? (
            'Guardar cambios'
          ) : usesWildcard ? (
            '🃏 Usar comodín y guardar'
          ) : isPastDay ? (
            'Agregar actividad'
          ) : (
            'Sumar actividad'
          )}
        </button>

        {/* ================================= */}
        {/* ELIMINAR */}
        {/* ================================= */}

        {isEditing && (
          <button
            type="button"
            onClick={
              handleDelete
            }
            disabled={
              saving ||
              deleting
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 font-bold text-red-500 transition active:scale-[0.98] disabled:opacity-50"
          >
            {deleting ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

                Eliminando...
              </>
            ) : (
              <>
                <Trash2
                  size={18}
                />

                Eliminar
                actividad
              </>
            )}
          </button>
        )}

      </div>
    </div>
  )
}

export default ActivityModal