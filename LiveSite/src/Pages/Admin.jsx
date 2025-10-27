import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

export default function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('listings')
  const [listings, setListings] = useState([])
  const [claims, setClaims] = useState([])
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Audit Log Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: ''
  })

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Check if user is admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') {
      alert('Access denied. Admin only.')
      navigate('/listings')
    }
  }, [navigate])

  // Fetch data based on active tab
  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')

    try {
      if (activeTab === 'listings') {
        // Fetch pending listings
        const res = await fetch(`${API_URL}/api/listings?status=pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setListings(data.listings || [])
      } else if (activeTab === 'claims') {
        // Fetch pending claims
        const res = await fetch(`${API_URL}/api/claims?status=pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setClaims(data.claims || [])
      } else if (activeTab === 'users') {
        // Fetch all users
        const res = await fetch(`${API_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      setError('Failed to fetch data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Approve/Deny Listing
  const handleListingAction = async (listingId, action) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/api/admin/listings/${listingId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Listing ${action}d successfully`)
        fetchData()
      } else {
        alert(data.error || `Failed to ${action} listing`)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  // Approve/Deny Claim
  const handleClaimAction = async (claimId, action) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/api/admin/claims/${claimId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Claim ${action}d successfully`)
        fetchData()
      } else {
        alert(data.error || `Failed to ${action} claim`)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  // Ban User
  const handleBanUser = async (userId) => {
    if (!confirm('Are you sure you want to ban this user?')) return

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (res.ok) {
        alert('User banned successfully')
        fetchData()
      } else {
        alert(data.error || 'Failed to ban user')
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  // Unban User
  const handleUnbanUser = async (userId) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/unban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (res.ok) {
        alert('User unbanned successfully')
        fetchData()
      } else {
        alert(data.error || 'Failed to unban user')
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  // Generate Audit Report
  const handleGenerateReport = async () => {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')

    const queryParams = new URLSearchParams()
    if (filters.startDate) queryParams.append('startDate', filters.startDate)
    if (filters.endDate) queryParams.append('endDate', filters.endDate)
    if (filters.userId) queryParams.append('userId', filters.userId)
    if (filters.action) queryParams.append('action', filters.action)

    try {
      const res = await fetch(`${API_URL}/api/admin/audit-logs?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setAuditLogs(data.logs || [])
      } else {
        setError(data.error || 'Failed to generate report')
      }
    } catch (err) {
      setError('Error generating report: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Export Audit Report as CSV
  const exportReportToCSV = () => {
    if (auditLogs.length === 0) {
      alert('No data to export')
      return
    }

    const headers = ['Log ID', 'User ID', 'Action', 'Date', 'IP Address', 'User Agent']
    const csvContent = [
      headers.join(','),
      ...auditLogs.map(log => [
        log.LogID,
        log.UserID,
        log.ActionDescription || log.ActionID,
        log.DateOfAudit,
        log.IPAddress,
        `"${log.UserAgent}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => navigate('/listings')} className="admin-back-btn">
          Back to Listings
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          Listings Moderation
        </button>
        <button
          className={`admin-tab ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          Claims Moderation
        </button>
        <button
          className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Audit Reports
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Listings Moderation Tab */}
      {activeTab === 'listings' && (
        <div className="admin-content">
          <h2>Pending Listings</h2>
          {loading ? (
            <p>Loading...</p>
          ) : listings.length === 0 ? (
            <p>No pending listings</p>
          ) : (
            <div className="admin-cards">
              {listings.map(listing => (
                <div key={listing.ListingID} className="admin-card">
                  <div className="admin-card-header">
                    <h3>{listing.ItemTitle}</h3>
                    <span className="admin-badge">{listing.Status}</span>
                  </div>
                  <div className="admin-card-body">
                    <p><strong>Category:</strong> {listing.CategoryID}</p>
                    <p><strong>Location:</strong> {listing.LocationLost}</p>
                    <p><strong>Description:</strong> {listing.Description || 'N/A'}</p>
                    <p><strong>Posted by User ID:</strong> {listing.UserID}</p>
                    <p><strong>Date:</strong> {new Date(listing.CreationDate).toLocaleDateString()}</p>
                  </div>
                  <div className="admin-card-actions">
                    <button
                      onClick={() => handleListingAction(listing.ListingID, 'approve')}
                      className="admin-btn approve"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleListingAction(listing.ListingID, 'deny')}
                      className="admin-btn deny"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claims Moderation Tab */}
      {activeTab === 'claims' && (
        <div className="admin-content">
          <h2>Pending Claims</h2>
          {loading ? (
            <p>Loading...</p>
          ) : claims.length === 0 ? (
            <p>No pending claims</p>
          ) : (
            <div className="admin-cards">
              {claims.map(claim => (
                <div key={claim.ClaimID} className="admin-card">
                  <div className="admin-card-header">
                    <h3>Claim #{claim.ClaimID}</h3>
                    <span className="admin-badge">Pending</span>
                  </div>
                  <div className="admin-card-body">
                    <p><strong>Listing ID:</strong> {claim.ListingID}</p>
                    <p><strong>Claimant ID:</strong> {claim.ClaimantID}</p>
                    <p><strong>Description:</strong> {claim.Description || 'N/A'}</p>
                    <p><strong>Claim Date:</strong> {new Date(claim.ClaimDate).toLocaleDateString()}</p>
                    {claim.ImageID && <p><strong>Proof Image ID:</strong> {claim.ImageID}</p>}
                  </div>
                  <div className="admin-card-actions">
                    <button
                      onClick={() => handleClaimAction(claim.ClaimID, 'approve')}
                      className="admin-btn approve"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleClaimAction(claim.ClaimID, 'deny')}
                      className="admin-btn deny"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Reports Tab */}
      {activeTab === 'reports' && (
        <div className="admin-content">
          <h2>Audit Log Reports</h2>

          <div className="admin-filters">
            <div className="filter-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label>End Date:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label>User ID:</label>
              <input
                type="number"
                placeholder="Enter User ID"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label>Action:</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              >
                <option value="">All Actions</option>
                <option value="1">User Login</option>
                <option value="2">User Logout</option>
                <option value="3">Create Listing</option>
                <option value="4">Edit Listing</option>
                <option value="5">Delete Listing</option>
                <option value="6">Claim Item</option>
                <option value="7">Send Message</option>
                <option value="8">Update Profile</option>
                <option value="9">Report User</option>
                <option value="10">Password Reset</option>
                <option value="11">Account Creation</option>
              </select>
            </div>
          </div>

          <div className="admin-report-actions">
            <button onClick={handleGenerateReport} className="admin-btn generate">
              Generate Report
            </button>
            {auditLogs.length > 0 && (
              <button onClick={exportReportToCSV} className="admin-btn export">
                Export to CSV
              </button>
            )}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : auditLogs.length === 0 ? (
            <p>No audit logs found. Click "Generate Report" to fetch data.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Date</th>
                    <th>IP Address</th>
                    <th>User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.LogID}>
                      <td>{log.LogID}</td>
                      <td>{log.UserID}</td>
                      <td>{log.ActionDescription || `Action ${log.ActionID}`}</td>
                      <td>{new Date(log.DateOfAudit).toLocaleString()}</td>
                      <td>{log.IPAddress}</td>
                      <td className="user-agent">{log.UserAgent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="admin-content">
          <h2>User Management</h2>
          {loading ? (
            <p>Loading...</p>
          ) : users.length === 0 ? (
            <p>No users found</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.UserID}>
                      <td>{user.UserID}</td>
                      <td>{user.Username}</td>
                      <td>{user.Email}</td>
                      <td><span className="admin-badge role">{user.Role}</span></td>
                      <td>
                        <span className={`admin-badge ${user.Status === 'banned' ? 'banned' : 'active'}`}>
                          {user.Status || 'Active'}
                        </span>
                      </td>
                      <td>{new Date(user.DateOfCreation).toLocaleDateString()}</td>
                      <td>
                        {user.Status === 'banned' ? (
                          <button
                            onClick={() => handleUnbanUser(user.UserID)}
                            className="admin-btn approve small"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user.UserID)}
                            className="admin-btn deny small"
                          >
                            Ban User
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
