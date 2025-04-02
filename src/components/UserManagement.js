import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/users?version=${version}`);
      
      if (response.status === 304) {
        // Ingen endringer
        return;
      }
      
      const data = await response.json();
      setUsers(data.users);
      setVersion(data.version);
      localStorage.setItem('usersVersion', data.version);
    } catch (error) {
      console.error('Kunne ikke hente brukere:', error);
      setError('Kunne ikke laste brukerlisten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Hent lagret versjonsnummer fra localStorage
    const savedVersion = localStorage.getItem('usersVersion') || 0;
    setVersion(parseInt(savedVersion));
    
    // Hent brukere
    fetchUsers();
    
    // Sjekk for oppdateringer hvert 30. sekund
    const interval = setInterval(fetchUsers, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleUserUpdate = async (userId, updates) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke oppdatere bruker');
      }

      // Oppdater brukerlisten
      fetchUsers();
    } catch (error) {
      console.error('Feil ved oppdatering av bruker:', error);
      setError('Kunne ikke oppdatere bruker');
    }
  };

  if (loading) {
    return <div className="loading">Laster brukerliste...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-management">
      <h2>Brukeradministrasjon</h2>
      
      <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-info">
              <h3>{user.name}</h3>
              <p className="email">{user.email}</p>
              <p className="role">Rolle: {user.role}</p>
              <div className="user-details">
                <input
                  type="text"
                  placeholder="Klasse"
                  value={user.class || ''}
                  onChange={(e) => handleUserUpdate(user.id, { class: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Årskull"
                  value={user.grade || ''}
                  onChange={(e) => handleUserUpdate(user.id, { grade: parseInt(e.target.value) || null })}
                />
              </div>
              <p className="created">Opprettet: {new Date(user.createdAt).toLocaleDateString('nb-NO')}</p>
            </div>
            
            {user.role !== 'ADMIN' && (
              <div className="role-controls">
                <select
                  value={user.role}
                  onChange={(e) => handleUserUpdate(user.id, { role: e.target.value })}
                >
                  <option value="USER">Bruker</option>
                  <option value="EDITOR">Redaktør</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .user-management {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .user-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .user-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .user-info {
          flex: 1;
        }

        .user-info h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .email {
          color: #666;
          margin: 5px 0;
        }

        .role {
          color: #888;
          font-size: 0.9em;
          margin: 5px 0;
        }

        .user-details {
          display: flex;
          gap: 10px;
          margin: 10px 0;
        }

        .user-details input {
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9em;
        }

        .user-details input[type="number"] {
          width: 80px;
        }

        .created {
          color: #999;
          font-size: 0.8em;
          margin: 5px 0;
        }

        .role-controls {
          margin-left: 20px;
        }

        .role-controls select {
          padding: 5px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .loading {
          text-align: center;
          padding: 20px;
          font-size: 1.2em;
          color: #666;
        }

        .error {
          color: #d32f2f;
          padding: 20px;
          text-align: center;
          background: #ffebee;
          border-radius: 4px;
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
}

export default UserManagement; 