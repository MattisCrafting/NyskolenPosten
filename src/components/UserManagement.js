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
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
          background: #f5f7f9;
          min-height: 100vh;
        }

        h2 {
          color: #2c3e50;
          margin-bottom: 30px;
          font-size: 2rem;
          text-align: center;
        }

        .user-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
          margin-top: 30px;
          padding: 20px;
        }

        .user-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 15px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .user-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.1);
        }

        .user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-info h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .email {
          color: #34495e;
          margin: 0;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .role {
          color: #7f8c8d;
          font-size: 0.95rem;
          margin: 0;
          padding: 4px 8px;
          background: #f8f9fa;
          border-radius: 6px;
          display: inline-block;
        }

        .user-details {
          display: flex;
          gap: 15px;
          margin: 15px 0;
        }

        .user-details input {
          padding: 8px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
          width: 100%;
        }

        .user-details input:focus {
          border-color: #3498db;
          outline: none;
        }

        .user-details input[type="number"] {
          width: 100px;
        }

        .created {
          color: #95a5a6;
          font-size: 0.85rem;
          margin: 0;
        }

        .role-controls {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #ecf0f1;
          width: 100%;
        }

        .role-controls select {
          width: 100%;
          padding: 8px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.95rem;
          background-color: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .role-controls select:focus {
          border-color: #3498db;
          outline: none;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 1.2rem;
          color: #7f8c8d;
        }

        .error {
          color: #e74c3c;
          padding: 20px;
          text-align: center;
          background: #fdf0ed;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}

export default UserManagement; 