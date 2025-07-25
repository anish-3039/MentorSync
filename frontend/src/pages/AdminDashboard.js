
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';



export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [menteesPage, setMenteesPage] = useState(0);
  const [annPage, setAnnPage] = useState(0);
  const [date, setDate] = useState('');
  const [cleanupMsg, setCleanupMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch statistics
  useEffect(() => {
    axios.get('/api/admin/statistics', authHeader)
      .then(res => setStats(res.data))
      .catch(() => setStats(null));
  }, []);


  // Trie suggestions (deduplicate by id, show dropdown)
  useEffect(() => {
    if (!search) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlighted(-1);
      return;
    }
    const timeout = setTimeout(() => {
      axios.get(`/api/admin/search?q=${encodeURIComponent(search)}`, authHeader)
        .then(res => {
          const arr = res.data.suggestions || [];
          const unique = Object.values(arr.reduce((acc, u) => { acc[u.id] = u; return acc; }, {}));
          setSuggestions(unique);
          setShowSuggestions(true);
          setHighlighted(-1);
        })
        .catch(() => { setSuggestions([]); setShowSuggestions(false); setHighlighted(-1); });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [search]);

  // Search users (deduplicate by id)
  const handleSearch = async e => {
    e.preventDefault();
    setShowSuggestions(false);
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/admin/search?q=${encodeURIComponent(search)}`, authHeader);
      const arr = res.data.suggestions || [];
      const unique = Object.values(arr.reduce((acc, u) => { acc[u.id] = u; return acc; }, {}));
      setSearchResults(unique);
    } catch {
      setError('Search failed');
      setSearchResults([]);
    }
    setLoading(false);
  };

  // Handle suggestion click or keyboard select
  const handleSuggestionSelect = async (user) => {
    setShowSuggestions(false);
    setSearch('');
    setSuggestions([]);
    await handleSelectUser(user);
  };

  // Keyboard navigation for suggestions
  const handleInputKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlighted >= 0 && highlighted < suggestions.length) {
        e.preventDefault();
        handleSuggestionSelect(suggestions[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Fetch user details
  const handleSelectUser = async user => {
    setSelectedUser(user);
    setUserDetails(null);
    setMenteesPage(0);
    setAnnPage(0);
    try {
      const res = await axios.get(`/api/admin/user/${user.id}`, authHeader);
      setUserDetails(res.data);
    } catch {
      setUserDetails(null);
    }
  };

  // Pagination for mentees/announcements
  const fetchUserDetailsPage = async (menteesPageArg, annPageArg) => {
    if (!selectedUser) return;
    try {
      const res = await axios.get(`/api/admin/user/${selectedUser.id}?limit=5&offset=${menteesPageArg*5}&annLimit=5&annOffset=${annPageArg*5}`, authHeader);
      setUserDetails(res.data);
    } catch {}
  };

  // Cleanup announcements
  const handleCleanup = async () => {
    if (!date) return setCleanupMsg('Select a date');
    try {
      await axios.delete('/api/admin/announcements', { ...authHeader, data: { date } });
      setCleanupMsg('Old announcements deleted');
    } catch {
      setCleanupMsg('Failed to delete');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#f9f9f9', borderRadius: 12, boxShadow: '0 2px 8px #ccc' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <button onClick={onLogout} style={{ padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
      </header>
      <section style={{ marginTop: 24, display: 'flex', gap: 32 }}>
        <div style={{ flex: 1, background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 4px #eee' }}>
          <h2>Statistics</h2>
          {stats ? (
            <ul>
              <li>Total Skills: {stats.totalSkills}</li>
              <li>Total Mentors: {stats.totalMentors}</li>
              <li>Total Students: {stats.totalStudents}</li>
            </ul>
          ) : <div>Loading stats...</div>}
          <div style={{ marginTop: 32 }}>
            <h3>Clear Old Announcements</h3>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', marginRight: 8 }} />
            <button onClick={handleCleanup} style={{ padding: '6px 16px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Clear</button>
            {cleanupMsg && <div style={{ marginTop: 8, color: cleanupMsg.includes('deleted') ? 'green' : 'red' }}>{cleanupMsg}</div>}
          </div>
        </div>
        <div style={{ flex: 2, background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 4px #eee' }}>
          <h2>User Search</h2>
          <form onSubmit={handleSearch} style={{ marginBottom: 16, position: 'relative' }} autoComplete="off">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true); setHighlighted(-1); }}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onKeyDown={handleInputKeyDown}
              style={{ width: 320, marginRight: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              autoComplete="off"
            />
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: 40,
                background: '#fff',
                border: '1.5px solid #f7b42c',
                borderRadius: 6,
                zIndex: 10,
                width: 320,
                maxHeight: 220,
                overflowY: 'auto',
                boxShadow: '0 2px 8px rgba(252, 87, 94, 0.08)'
              }}>
                {suggestions.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: i === highlighted ? '#3498db' : 'transparent',
                      color: i === highlighted ? '#fff' : '#222',
                      borderBottom: i !== suggestions.length - 1 ? '1px solid #f7b42c' : 'none'
                    }}
                    onMouseDown={() => handleSuggestionSelect(s)}
                    onMouseEnter={() => setHighlighted(i)}
                  >
                    {s.name} ({s.email})
                  </div>
                ))}
              </div>
            )}
            <button type="submit" style={{ padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Search</button>
          </form>
          {loading ? <div>Searching...</div> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {searchResults.map(user => (
                <li key={user.id} style={{ marginBottom: 8 }}>
                  {user.name} ({user.email}) - {user.role}
                  <button style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 4, background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => handleSelectUser(user)}>View Details</button>
                </li>
              ))}
            </ul>
          )}
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
      </section>
      {/* User details modal */}
      {selectedUser && userDetails && (
        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 16, minWidth: 320, maxWidth: 520, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
            <h3>{userDetails.name} ({userDetails.role})</h3>
            <p>Email: {userDetails.email}</p>
            <p>Skills: {userDetails.skills?.join(', ') || 'None'}</p>
            <p>Location: {userDetails.location ? Object.values(userDetails.location).join(', ') : 'N/A'}</p>
            {userDetails.role === 'student' && (
              <p>Mentor: {userDetails.mentor || 'N/A'}</p>
            )}
            {userDetails.role === 'mentor' && (
              <>
                <div style={{ margin: '12px 0' }}>
                  <strong>Mentees:</strong>
                  <ul style={{ paddingLeft: 16 }}>
                    {userDetails.mentees?.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                  <button disabled={menteesPage === 0} onClick={async () => { setMenteesPage(menteesPage-1); await fetchUserDetailsPage(menteesPage-1, annPage); }}>Prev</button>
                  <button disabled={userDetails.mentees?.length < 5} onClick={async () => { setMenteesPage(menteesPage+1); await fetchUserDetailsPage(menteesPage+1, annPage); }}>Next</button>
                </div>
                <div style={{ margin: '12px 0' }}>
                  <strong>Announcements:</strong>
                  <ul style={{ paddingLeft: 16 }}>
                    {userDetails.announcements?.map((a, i) => <li key={a.id}>{a.content} <span style={{ color: '#888', fontSize: 12 }}>({a.created_at?.slice(0,10)})</span></li>)}
                  </ul>
                  <button disabled={annPage === 0} onClick={async () => { setAnnPage(annPage-1); await fetchUserDetailsPage(menteesPage, annPage-1); }}>Prev</button>
                  <button disabled={userDetails.announcements?.length < 5} onClick={async () => { setAnnPage(annPage+1); await fetchUserDetailsPage(menteesPage, annPage+1); }}>Next</button>
                </div>
              </>
            )}
            <button onClick={() => { setSelectedUser(null); setUserDetails(null); }} style={{ marginTop: 16, padding: '8px 16px', borderRadius: 4, background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
