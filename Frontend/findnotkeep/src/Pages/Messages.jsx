import { useParams, Link } from 'react-router-dom'

const THREADS = [
  { id: 't1', with: 'Finder: Sam', last: 'Hi, describe your wallet?' },
  { id: 't2', with: 'Owner: Alex', last: 'Thanks! That is my phone.' },
]

export default function Messages() {
  // If you plan separate route `/messages/:threadId`, you can read it:
  const { threadId } = useParams()

  if (threadId) {
    return (
      <main>
        <h2>Message Thread: {threadId}</h2>
        <p>(Placeholder conversation)</p>
        <p><Link to="/messages">Back to all messages</Link></p>
      </main>
    )
  }

  return (
    <main>
      <h2>Messages</h2>
      <ul>
        {THREADS.map(t => (
          <li key={t.id}>
            <Link to={`/messages/${t.id}`}>{t.with}</Link> — {t.last}
          </li>
        ))}
      </ul>
    </main>
  )
}
