import { Link } from 'react-router-dom'

const MY_MOCK = [
  { id: 11, title: 'Blue Backpack', status: 'lost' },
  { id: 12, title: 'Student Card',  status: 'found' },
]

export default function ProfileListings() {
  return (
    <main>
      <h2>My Listings</h2>
      <p><Link to="/create">+ Create new listing</Link></p>
      <ul>
        {MY_MOCK.map(x => (
          <li key={x.id}>
            <Link to={`/listings/${x.id}`}>{x.title}</Link> — {x.status}
          </li>
        ))}
      </ul>
    </main>
  )
}
