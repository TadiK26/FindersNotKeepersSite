import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function ContactFromListing() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    // TODO: send to backend later
    navigate('/messages') // go to inbox after sending
  }

  return (
    <main>
      <h2>Contact Owner (Listing {listingId})</h2>
      <form onSubmit={onSubmit}>
        <label>
          Message to owner
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi, I think this is my item because..." />
        </label>
        <button type="submit">Send</button>
      </form>
    </main>
  )
}
