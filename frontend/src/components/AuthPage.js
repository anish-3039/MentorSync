import React, { useState, useEffect } from 'react';
import axios from 'axios';

const initialLocation = {
  state: '',
  country: '',
  village: '',
  landmark: '',
  pincode: ''
};

const initialForm = {
  name: '',
  email: '',
  password: '',
  ...initialLocation
};

const AuthPage = ({ onAuth }) => {

  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('student');
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [skills, setSkills] = useState([]); // selected skills
  const [allSkills, setAllSkills] = useState([]); // for dropdown
  const [newSkill, setNewSkill] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [skillSuggestTimeout, setSkillSuggestTimeout] = useState(null);

  useEffect(() => {
    if (mode === 'signup') {
      axios.get('/api/skills')
        .then(res => setAllSkills(res.data))
        .catch(() => setAllSkills([]));
    }
  }, [mode]);

  // Suggest skills as user types (debounced, using Trie API)
  useEffect(() => {
    if (!newSkill) {
      setSkillSuggestions([]);
      return;
    }
    if (skillSuggestTimeout) clearTimeout(skillSuggestTimeout);
    setSkillSuggestTimeout(setTimeout(async () => {
      try {
        const res = await axios.get(`/api/suggest/skills?query=${encodeURIComponent(newSkill)}`);
        setSkillSuggestions(res.data.filter(s => !skills.includes(s)));
      } catch {
        setSkillSuggestions([]);
      }
    }, 400));
    // eslint-disable-next-line
  }, [newSkill]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async e => {
    e.preventDefault();
    const location = {
      state: form.state,
      country: form.country,
      village: form.village,
      landmark: form.landmark,
      pincode: form.pincode
    };
    try {
      const res = await axios.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        location,
        skills
      });
      setMessage('Registration successful!');
      if (res.data.token) onAuth(res.data.token, role);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleAddSkill = (skillToAdd) => {
    const skill = skillToAdd || newSkill;
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill('');
      setSkillSuggestions([]);
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleLogin = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', {
        email: form.email,
        password: form.password,
        role
      });
      setMessage('Login successful!');
      if (res.data.token) onAuth(res.data.token, role);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-toggle">
        <button onClick={() => setMode('signup')}>Sign Up</button>
        <button onClick={() => setMode('login')}>Login</button>
      </div>
      {mode === 'signup' ? (
        <form onSubmit={handleSignup}>
          <div>
            <button type="button" onClick={() => setRole('student')}>Student</button>
            <button type="button" onClick={() => setRole('mentor')}>Mentor</button>
            <button type="button" onClick={() => setRole('admin')}>Admin</button>
          </div>
          <h2>Sign Up as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          {/* Skills dropdown and add/remove */}
          {role !== 'admin' && (
            <div>
              <label style={{fontWeight:600, marginBottom: 4, display:'block'}}>Skills:</label>
              <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'flex-end',position:'relative', justifyContent:'space-between'}}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: 240 }}>
                  <input
                    type="text"
                    placeholder="let us suggest..."
                    value={newSkill}
                    onChange={e=>setNewSkill(e.target.value)}
                    style={{ width: '100%', fontSize: '1.08rem', padding: '12px 14px', border: '2px solid #f7b42c', borderRadius: 8, background: '#fffbe7', color: '#fc575e', fontWeight: 600, boxShadow: '0 2px 8px rgba(252, 87, 94, 0.04)' }}
                  />
                  {/* Trie-based suggestions below input */}
                  {newSkill && skillSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '100%',
                      background: '#fff',
                      border: '2px solid #f7b42c',
                      borderRadius: 8,
                      marginTop: 4,
                      zIndex: 10,
                      width: '100%',
                      maxHeight: 180,
                      overflowY: 'auto',
                      boxShadow: '0 4px 16px rgba(252, 87, 94, 0.10)'
                    }}>
                      {skillSuggestions.map((s, i) => (
                        <div
                          key={s + i}
                          style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: i !== skillSuggestions.length - 1 ? '1px solid #f7b42c' : 'none', fontWeight: 500, color: '#fc575e', background: '#fff', transition: 'background 0.2s' }}
                          onMouseDown={() => handleAddSkill(s)}
                          onMouseOver={e => e.currentTarget.style.background = '#fffbe7'}
                          onMouseOut={e => e.currentTarget.style.background = '#fff'}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  style={{
                    height: 44,
                    minWidth: 60,
                    background: 'linear-gradient(90deg, #fc575e 0%, #f7b42c 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '1.08rem',
                    boxShadow: '0 2px 8px rgba(252, 87, 94, 0.08)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    marginBottom: 0,
                    marginLeft: 0,
                    alignSelf: 'unset',
                    display: 'block',
                  }}
                  onClick={() => handleAddSkill(newSkill)}
                >
                  Add
                </button>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
                {skills.map(skill => (
                  <span key={skill} style={{background:'#f7b42c',color:'#fff',padding:'4px 10px',borderRadius:12,display:'inline-flex',alignItems:'center'}}>
                    {skill} <button type="button" onClick={()=>handleRemoveSkill(skill)} style={{marginLeft:4,background:'none',border:'none',color:'#fff',cursor:'pointer'}}>×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <input name="state" placeholder="State" value={form.state} onChange={handleChange} required />
          <input name="country" placeholder="Country" value={form.country} onChange={handleChange} required />
          <input name="village" placeholder="Village" value={form.village} onChange={handleChange} required />
          <input name="landmark" placeholder="Landmark" value={form.landmark} onChange={handleChange} />
          <input name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} required />
          <button type="submit">Sign Up</button>
        </form>
      ) : (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <label>Role:
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button type="submit">Login</button>
        </form>
      )}
      {message && <div style={{marginTop:16, color:'red'}}>{message}</div>}
    </div>
  );
};

export default AuthPage;
