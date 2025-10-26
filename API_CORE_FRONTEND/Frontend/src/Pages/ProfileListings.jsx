import { useState, useEffect } from "react";
//import "./ProfileListings.css";

export default function ProfileListings({ userId }) {
  const [activeTab, setActiveTab] = useState("lost");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const response = await fetch(`/auth/all-listings`);
        const data = await response.json();

        // Filter by logged-in user and active tab
        const userListings = data.filter(
          (item) => item.user_id === userId && item.status === activeTab
        );
        setListings(userListings);
      } catch (err) {
        console.error(err);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [activeTab, userId]);

  return (
    <div className="profile-listings">
      <header>
        <h1>My Listing</h1>
      </header>

      {/* Tabs */}
      <div className="tabs">
        {["lost", "returned", "found"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Items
          </button>
        ))}
      </div>

      {/* Listings Cards */}
      <div className="listings-container">
        {loading ? (
          <p>Loading...</p>
        ) : listings.length === 0 ? (
          <p>No {activeTab} items yet.</p>
        ) : (
          listings.map((item) => (
            <div key={item.id} className="listing-card">
              <img
                src={item.image_url || "/default-image.png"}
                alt={item.name}
              />
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>Status: {item.status}</p>
            </div>
          ))
        )}
      </div>

      {/* Create Listing Button */}
      <button
        className="create-listing-btn"
        onClick={() => (window.location.href = "/create-listing")}
      >
        Create Listing
      </button>
    </div>
  );
}
