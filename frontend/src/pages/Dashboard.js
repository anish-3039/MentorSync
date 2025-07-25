import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = ({ token, role, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [annPage, setAnnPage] = useState(0);
  const [annHasMore, setAnnHasMore] = useState(true);
  const [annEditId, setAnnEditId] = useState(null);
  const [annEditContent, setAnnEditContent] = useState('');
  const [annSkillFilter, setAnnSkillFilter] = useState('');
  const [newAnnSkill, setNewAnnSkill] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [skills, setSkills] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        if (role === 'student') {
          const res = await axios.get('/api/dashboard/student/profile', { headers: { Authorization: `Bearer ${token}` } });
          setProfile(res.data);
        } else if (role === 'mentor') {
          const res = await axios.get('/api/dashboard/mentor/profile', { headers: { Authorization: `Bearer ${token}` } });
          setProfile(res.data);
          setSkills(res.data.skills || []);
        }
      } catch {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [token, role]);

  useEffect(() => {
    if (!token) return;
    const fetchAnnouncements = async () => {
      try {
        let url = '';
        if (role === 'student') {
          url = `/api/dashboard/student/announcements?offset=${annPage*5}&limit=5`;
        } else if (role === 'mentor') {
          url = `/api/dashboard/mentor/announcements?offset=${annPage*5}&limit=5`;
          if (annSkillFilter) url += `&skill=${encodeURIComponent(annSkillFilter)}`;
        }
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        if (annPage === 0) setAnnouncements(res.data);
        else setAnnouncements(a => [...a, ...res.data]);
        setAnnHasMore(res.data.length === 5);
      } catch {
        setAnnouncements([]);
        setAnnHasMore(false);
      }
    };
    fetchAnnouncements();
    // eslint-disable-next-line
  }, [token, role, annPage, annSkillFilter]);

  const handleCreateAnnouncement = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/announcement', { skillName: newAnnSkill, content: newAnnContent }, { headers: { Authorization: `Bearer ${token}` } });
      setNewAnnContent('');
      setMessage('Announcement sent!');
      setAnnPage(0);
    } catch (err) {
      setMessage('Failed to send announcement');
    }
  };

  const handleEditAnnouncement = async (id) => {
    setMessage('');
    try {
      await axios.put(`/api/dashboard/mentor/announcement/${id}`, { content: annEditContent }, { headers: { Authorization: `Bearer ${token}` } });
      setAnnEditId(null);
      setAnnEditContent('');
      setMessage('Announcement updated!');
      setAnnPage(0);
    } catch {
      setMessage('Failed to update announcement');
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#f9f9f9', borderRadius: 12, boxShadow: '0 2px 8px #ccc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard ({role})</h2>
        <button onClick={onLogout} style={{ padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
      </div>
      {profile && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, margin: '24px 0', boxShadow: '0 1px 4px #eee' }}>
          <h3 style={{ margin: 0 }}>{profile.name}</h3>
          <div style={{ color: '#888', fontSize: 14 }}>Joined: {profile.created_at?.slice(0,10)}</div>
          <div style={{ marginTop: 8 }}>Skills: {profile.skills?.join(', ') || 'None'}</div>
          {role === 'student' && <div>Mentor: {profile.mentor || 'N/A'}</div>}
          {role === 'mentor' && <div>Students: {profile.students?.map(s => s.name).join(', ') || 'None'}</div>}
        </div>
      )}
      {role === 'mentor' && (
        <form onSubmit={handleCreateAnnouncement} style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={newAnnSkill} onChange={e => setNewAnnSkill(e.target.value)} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="">Select Skill</option>
            {skills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={newAnnContent} onChange={e => setNewAnnContent(e.target.value)} placeholder="Announcement..." required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', flex: 1 }} />
          <button type="submit" style={{ padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Send</button>
        </form>
      )}
      {role === 'mentor' && (
        <div style={{ marginBottom: 16 }}>
          <label>Filter by Skill: </label>
          <select value={annSkillFilter} onChange={e => { setAnnSkillFilter(e.target.value); setAnnPage(0); }} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="">All</option>
            {skills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      <h3>Announcements</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {announcements.map(a => (
          <li key={a.id} style={{ background: '#fff', marginBottom: 8, padding: 12, borderRadius: 6, boxShadow: '0 1px 4px #eee', position: 'relative' }}>
            <div style={{ fontWeight: 500 }}>{a.content}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{a.skill && `Skill: ${a.skill}`} {a.mentor_name && `| Mentor: ${a.mentor_name}`}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{a.created_at?.slice(0,10)}</div>
            {role === 'mentor' && annEditId !== a.id && (
              <button style={{ position: 'absolute', right: 12, top: 12, fontSize: 12 }} onClick={() => { setAnnEditId(a.id); setAnnEditContent(a.content); }}>Edit</button>
            )}
            {role === 'mentor' && annEditId === a.id && (
              <form onSubmit={e => { e.preventDefault(); handleEditAnnouncement(a.id); }} style={{ marginTop: 8 }}>
                <input value={annEditContent} onChange={e => setAnnEditContent(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', width: '80%' }} />
                <button type="submit" style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 4, background: '#3498db', color: '#fff', border: 'none' }}>Save</button>
                <button type="button" style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 4, background: '#eee', color: '#333', border: 'none' }} onClick={() => setAnnEditId(null)}>Cancel</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {annHasMore && <button onClick={() => setAnnPage(annPage+1)} style={{ padding: '8px 16px', background: '#f7b42c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Load More</button>}
      {message && <div style={{ color: 'red', marginTop: 12 }}>{message}</div>}
    </div>
  );
};

export default Dashboard;