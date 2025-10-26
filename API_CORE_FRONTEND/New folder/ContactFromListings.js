import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function ContactFromListing({ accessToken, currentUserId }) {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!message.trim()) {
      setError("Message can't be empty")
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/messages/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          receiver_id: parseInt(listingId), // ideally pass ownerId from listing
          content: message
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess("Message sent successfully!")
        setMessage('')
        navigate('/messages') // go to inbox
      } else {
        setError(data.error || "Failed to send message")
      }
    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    }
  }

  return (
    <main>
      <h2>Contact Owner (Listing {listingId})</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={onSubmit}>
        <label>
          Message to owner
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Hi, I think this is my item because..."
          />
        </label>
        <button type="submit">Send</button>
      </form>
    </main>
  )
}
