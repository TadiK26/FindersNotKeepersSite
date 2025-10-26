import { useParams, useNavigate, Link } from 'react-router-dom';
import { LISTINGS } from '../data/listings';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = LISTINGS.find(x => String(x.id) === String(id));

  if (!item) {
    return (
      <main>
        <h2>Listing not found</h2>
        <button onClick={() => navigate(-1)}>Go back</button>
        <p>Or go to <Link to="/listings">all listings</Link>.</p>
      </main>
    );
  }

  return (
    <main>
      <button onClick={() => navigate(-1)}>← Back</button>
      <h2>{item.title}</h2>
      <p><strong>Status:</strong> {item.status}</p>
      <p><strong>Category:</strong> {item.category}</p>
      <p><strong>Location:</strong> {item.location}</p>
      <p><strong>Date:</strong> {item.date}</p>
      <p><strong>Description:</strong> {item.description}</p>

      {/* For later: require login, then route to contact */}
      <button onClick={() => navigate('/login')}>Contact Owner</button>
    </main>
  );
}
