import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CreateListing() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    type: 'lost', title: '', category: '', location: '', date: '', description: ''
  })
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = (e) => {
    e.preventDefault()
    // TODO: send to backend later
    navigate('/profile/listings') // go to "My Listings"
  }

  return (
    <main>
      <h2>Create Listing</h2>
      <form onSubmit={onSubmit}>
        <label>
          Type
          <select name="type" value={form.type} onChange={onChange}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </label>

        <label>
          Title
          <input name="title" value={form.title} onChange={onChange} placeholder="e.g., Black Wallet" />
        </label>

        <label>
          Category
          <input name="category" value={form.category} onChange={onChange} placeholder="Accessories, Electronics..." />
        </label>

        <label>
          Location
          <input name="location" value={form.location} onChange={onChange} placeholder="Hatfield, LC Building..." />
        </label>

        <label>
          Date
          <input name="date" type="date" value={form.date} onChange={onChange} />
        </label>

        <label>
          Description
          <textarea name="description" value={form.description} onChange={onChange} placeholder="Details..." />
        </label>

        <button type="submit">Save</button>
      </form>
    </main>
  )
}
