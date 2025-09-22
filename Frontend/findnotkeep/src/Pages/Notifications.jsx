const MOCK_NOTIFS = [
  { id: 1, text: 'Your claim for "Black Wallet" was received.' },
  { id: 2, text: 'New match near Hatfield for "Student Card".' },
]

export default function Notifications() {
  return (
    <main>
      <h2>Notifications</h2>
      <ul>
        {MOCK_NOTIFS.map(n => <li key={n.id}>{n.text}</li>)}
      </ul>
    </main>
  )
}
