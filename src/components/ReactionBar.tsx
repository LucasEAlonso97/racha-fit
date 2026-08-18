import {
  useState,
} from 'react'

import type {
  ActivityReaction,
  ReactionEmoji,
} from '../types'

type Props = {
  reactions: ActivityReaction[]
  currentUserId: string

  onReact: (
    emoji: ReactionEmoji,
  ) => void | Promise<void>
}

const reactionOptions:
  ReactionEmoji[] = [
    '🔥',
    '💪',
    '👏',
    '😂',
    '❤️',
  ]

function ReactionBar({
  reactions,
  currentUserId,
  onReact,
}: Props) {
  const [
    loadingEmoji,
    setLoadingEmoji,
  ] =
    useState<ReactionEmoji | null>(
      null,
    )

  const currentReaction =
    reactions.find(
      (reaction) =>
        reaction.user_id ===
        currentUserId,
    )

  const handleReaction =
    async (
      emoji: ReactionEmoji,
    ) => {
      if (loadingEmoji) {
        return
      }

      setLoadingEmoji(
        emoji,
      )

      try {
        await onReact(
          emoji,
        )
      } finally {
        setLoadingEmoji(
          null,
        )
      }
    }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {reactionOptions.map(
        (emoji) => {
          const count =
            reactions.filter(
              (reaction) =>
                reaction.emoji ===
                emoji,
            ).length

          const selected =
            currentReaction?.emoji ===
            emoji

          const loading =
            loadingEmoji ===
            emoji

          return (
            <button
              key={emoji}
              type="button"
              onClick={() =>
                handleReaction(
                  emoji,
                )
              }
              disabled={
                Boolean(
                  loadingEmoji,
                )
              }
              className={`flex min-w-[45px] items-center justify-center gap-1 rounded-full border px-2.5 py-1.5 text-sm font-bold transition active:scale-95 disabled:opacity-60 ${
                selected
                  ? 'border-violet-400 bg-violet-100 text-violet-700'
                  : 'border-zinc-100 bg-white text-zinc-500'
              }`}
            >
              <span>
                {loading
                  ? '…'
                  : emoji}
              </span>

              {count > 0 && (
                <span className="text-[11px]">
                  {count}
                </span>
              )}
            </button>
          )
        },
      )}
    </div>
  )
}

export default ReactionBar