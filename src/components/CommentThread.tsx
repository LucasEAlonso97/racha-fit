import {
  useState,
} from 'react'

import {
  LoaderCircle,
  SendHorizontal,
  Trash2,
} from 'lucide-react'

import UserAvatar from './UserAvatar'

import type {
  ActivityComment,
  User,
} from '../types'

const MAX_LENGTH = 280

type Props = {
  comments: ActivityComment[]
  users: User[]
  currentUserId: string

  onAdd: (
    body: string,
  ) => Promise<boolean>

  onDelete: (
    commentId: string,
  ) => void | Promise<void>
}

function formatCommentTime(
  createdAt: string,
) {
  const date = new Date(createdAt)

  const sameDay =
    date.toDateString() ===
    new Date().toDateString()

  return sameDay
    ? date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
      })
}

/*
 * ========================================
 * COMENTARIOS DE UNA ACTIVIDAD
 * ========================================
 */

function CommentThread({
  comments,
  users,
  currentUserId,
  onAdd,
  onDelete,
}: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] =
    useState(false)

  const trimmed = text.trim()

  const send = async () => {
    if (!trimmed || sending) {
      return
    }

    setSending(true)

    const saved = await onAdd(trimmed)

    setSending(false)

    if (saved) {
      setText('')
    }
  }

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3">
      {comments.length > 0 && (
        <ul className="mb-3 space-y-2">
          {comments.map((comment) => {
            const author = users.find(
              (user) =>
                user.id === comment.user_id,
            )

            const isMine =
              comment.user_id ===
              currentUserId

            return (
              <li
                key={comment.id}
                className="flex items-start gap-2"
              >
                {author && (
                  <UserAvatar
                    user={author}
                    size="sm"
                  />
                )}

                <div className="min-w-0 flex-1 rounded-2xl bg-zinc-50 px-3 py-2">
                  <p className="text-xs font-black text-zinc-700">
                    {isMine
                      ? 'Vos'
                      : (author?.name ??
                        'Alguien')}

                    <span className="ml-2 font-semibold text-zinc-400">
                      {formatCommentTime(
                        comment.created_at,
                      )}
                    </span>
                  </p>

                  <p className="mt-0.5 whitespace-pre-line break-words text-sm text-zinc-600">
                    {comment.body}
                  </p>
                </div>

                {isMine && (
                  <button
                    type="button"
                    aria-label="Borrar comentario"
                    onClick={() =>
                      onDelete(comment.id)
                    }
                    className="mt-2 shrink-0 text-zinc-300 transition hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        <input
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder="Comentá algo…"
          disabled={sending}
          className="min-w-0 flex-1 rounded-2xl bg-zinc-50 px-4 py-2.5 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:bg-zinc-100"
        />

        <button
          type="submit"
          aria-label="Enviar comentario"
          disabled={!trimmed || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500 text-white transition active:scale-95 disabled:opacity-40"
        >
          {sending ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <SendHorizontal size={18} />
          )}
        </button>
      </form>
    </div>
  )
}

export default CommentThread
