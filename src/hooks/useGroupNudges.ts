import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

type SendNudgeResult =
  | 'sent'
  | 'already_sent'
  | 'already_active'
  | 'error'

function getBuenosAiresDateKey() {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'America/Argentina/Buenos_Aires',

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',
      },
    ).formatToParts(
      new Date(),
    )

  const year =
    parts.find(
      part =>
        part.type ===
        'year',
    )?.value

  const month =
    parts.find(
      part =>
        part.type ===
        'month',
    )?.value

  const day =
    parts.find(
      part =>
        part.type ===
        'day',
    )?.value

  return `${year}-${month}-${day}`
}

export function useGroupNudges(
  groupId: string,
  currentUserId: string,
) {
  const [
    sentTo,
    setSentTo,
  ] =
    useState<
      Set<string>
    >(
      new Set(),
    )

  const [
    sendingTo,
    setSendingTo,
  ] =
    useState<
      string | null
    >(
      null,
    )

  /*
   * ========================================
   * CARGAR EMPUJONES ENVIADOS HOY
   * ========================================
   */

  const refresh =
    useCallback(
      async () => {
        if (
          !groupId ||
          !currentUserId
        ) {
          return
        }

        const todayKey =
          getBuenosAiresDateKey()

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'social_notifications',
            )
            .select(
              'recipient_user_id',
            )
            .eq(
              'group_id',
              groupId,
            )
            .eq(
              'actor_user_id',
              currentUserId,
            )
            .eq(
              'type',
              'nudge',
            )
            .eq(
              'notification_date',
              todayKey,
            )

        if (
          error
        ) {
          console.error(
            'Error cargando empujones enviados:',
            error,
          )

          return
        }

        setSentTo(
          new Set(
            (
              data ??
              []
            ).map(
              row =>
                row.recipient_user_id as string,
            ),
          ),
        )
      },
      [
        groupId,
        currentUserId,
      ],
    )

  useEffect(() => {
    void refresh()
  }, [
    refresh,
  ])

  /*
   * ========================================
   * ENVIAR
   * ========================================
   */

  const sendNudge =
    async (
      recipientUserId: string,
    ): Promise<SendNudgeResult> => {
      if (
        sendingTo
      ) {
        return 'error'
      }

      setSendingTo(
        recipientUserId,
      )

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'send_group_nudge',
          {
            p_group_id:
              groupId,

            p_recipient_user_id:
              recipientUserId,
          },
        )

      setSendingTo(
        null,
      )

      if (
        error
      ) {
        console.error(
          'Error enviando empujón:',
          error,
        )

        return 'error'
      }

      const reason =
        data?.reason as
          | string
          | undefined

      if (
        data?.sent ||
        reason ===
          'already_sent'
      ) {
        setSentTo(
          current => {
            const next =
              new Set(
                current,
              )

            next.add(
              recipientUserId,
            )

            return next
          },
        )
      }

      if (
        reason ===
        'already_active'
      ) {
        return 'already_active'
      }

      if (
        reason ===
        'already_sent'
      ) {
        return 'already_sent'
      }

      return data?.sent
        ? 'sent'
        : 'error'
    }

  return {
    sentTo,
    sendingTo,
    sendNudge,
    refresh,
  }
}