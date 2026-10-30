import type { User } from '@tanku/shared'
import { t } from '../i18n/index.ts'

interface Props {
  users: User[]
  currentId: string
  onChange: (userId: string) => void
}

export function UserPicker({ users, currentId, onChange }: Props) {
  return (
    <label className="user-picker">
      <span>{t('user.picker.label')}</span>
      <select value={currentId} onChange={(event) => onChange(event.target.value)}>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  )
}
