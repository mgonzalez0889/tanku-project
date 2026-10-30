import { api } from './api.ts'
import { t } from './i18n/index.ts'
import { useCurrentUser } from './useCurrentUser.ts'
import { useLoad } from './useLoad.ts'
import { Catalog } from './views/Catalog.tsx'
import { ErrorAlert } from './views/ErrorAlert.tsx'
import { UserPicker } from './views/UserPicker.tsx'

export default function App() {
  const { data, error } = useLoad(api.users, [])
  const [rememberedId, chooseUser] = useCurrentUser()

  // The first user stands in until someone chooses; the other one is who we give a gift to.
  const users = data ?? []
  const me = users.find((user) => user.id === rememberedId) ?? users[0]
  const recipient = users.find((user) => user.id !== me?.id)

  return (
    <main>
      <header>
        <h1>{t('app.title')}</h1>
        {me && <UserPicker users={users} currentId={me.id} onChange={chooseUser} />}
      </header>
      {error && <ErrorAlert message={error} />}
      {recipient && <Catalog key={recipient.id} recipient={recipient} />}
    </main>
  )
}
