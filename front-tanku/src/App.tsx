import { api } from './api.ts'
import { t } from './i18n/index.ts'
import { useCurrentUser } from './useCurrentUser.ts'
import { useLoad } from './useLoad.ts'
import { ErrorAlert } from './views/ErrorAlert.tsx'
import { Home } from './views/Home.tsx'
import { UserPicker } from './views/UserPicker.tsx'

export default function App() {
  const { data: loadedUsers, error: usersError } = useLoad(api.users, [])
  const { data: products, error: productsError } = useLoad(api.products, [])
  const [rememberedId, chooseUser] = useCurrentUser()

  // The first user stands in until someone chooses; the other one is who we give a gift to.
  const users = loadedUsers ?? []
  const me = users.find((user) => user.id === rememberedId) ?? users[0]
  const recipient = users.find((user) => user.id !== me?.id)
  const error = usersError ?? productsError

  return (
    <main>
      <header>
        <h1>{t('app.title')}</h1>
        {me && <UserPicker users={users} currentId={me.id} onChange={chooseUser} />}
      </header>
      {error && <ErrorAlert message={error} />}
      {/* The key starts a fresh screen, socket and notices for each user. */}
      {me && recipient && products && <Home key={me.id} me={me} recipient={recipient} users={users} products={products} />}
    </main>
  )
}
