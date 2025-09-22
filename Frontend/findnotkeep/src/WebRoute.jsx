import { Routes, Route } from 'react-router-dom'
import Landing from './Pages/LandingPage.jsx'
import About from './Pages/About.jsx'
import Login from './Pages/Login.jsx'
import Signup from './Pages/Signup.jsx'
import Listings from './Pages/Listings.jsx'
import ListingDetail from './Pages/ListingDetail.jsx'
import Filters from './Pages/Filters.jsx'
import Settings from './Pages/Settings.jsx'
import Profile from './Pages/Profile.jsx'
import ProfileListings from './Pages/ProfileListings.jsx'
import CreateListing from './Pages/CreateListing.jsx'
import Notifications from './Pages/Notifications.jsx'
import Messages from './Pages/Messages.jsx'
import ContactFromListing from './Pages/ContactFromListing.jsx'


export default function Web() {
  return (
    <Routes>
      {/*Route to follow if a specific string is added to the url*/}
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />

      <Route path="/filters" element={<Filters />} />

      <Route path="/settings" element={<Settings />} />

      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/listings" element={<ProfileListings />} />

      <Route path="/create" element={<CreateListing />} />

      <Route path="/notifications" element={<Notifications />} />
      <Route path="/messages/:threadId" element={<Messages />} />

      <Route path="/contact/:listingId" element={<ContactFromListing />} />

      {/*You can later replace it with a styled 404 page component.*/}
      <Route path="*" element={<h2 style={{padding:16}}>Page not found</h2>} />
    </Routes>
  )
}
