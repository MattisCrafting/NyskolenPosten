import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import './AdminPanel.css'; // Bruker samme CSS som AdminPanel
import { useLanguage } from '../utils/LanguageContext';

function WebsitePanel({ innloggetBruker, currentSettings, onUpdateSettings }) {
  const { translations } = useLanguage();
  const [melding, setMelding] = useState('');
  const [feilmelding, setFeilmelding] = useState('');
  const [passordInput, setPassordInput] = useState('');
  const [erAutentisert, setErAutentisert] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [localSettings, setLocalSettings] = useState(currentSettings || {
    lockdown: false,
    fullLockdown: false,
    note: ""
  });
  
  // Sjekk om brukeren er teknisk leder
  if (!innloggetBruker || innloggetBruker.rolle !== 'teknisk_leder') {
    return <Navigate to="/" replace />;
  }
  
  // Passordsjekk
  const handlePassordSubmit = (e) => {
    e.preventDefault();
    // Bruk det hemmelige passordet i stedet for brukerens passord
    if (passordInput === 'Tveita16') {
      setErAutentisert(true);
      setFeilmelding('');
    } else {
      setFeilmelding('Feil passord. Prøv igjen.');
    }
  };
  
  // Oppdater settings både lokalt og globalt
  const updateSettings = (newSettings) => {
    // Oppdater lokalt state
    setLocalSettings(newSettings);
    
    // Oppdater globalt (i App.js og i localStorage)
    const result = onUpdateSettings(newSettings);
    
    if (result.success) {
      setMelding('Innstillingene ble oppdatert');
    } else {
      setFeilmelding(`Feil ved oppdatering av innstillinger: ${result.error || 'Ukjent feil'}`);
    }
  };
  
  // Toggle LOCKDOWN mode (bare lesing, ingen redigering)
  const toggleLockdown = () => {
    const newSettings = {
      ...localSettings,
      lockdown: !localSettings.lockdown
    };
    
    updateSettings(newSettings);
    setMelding(`LOCKDOWN modus er nå ${newSettings.lockdown ? 'aktivert' : 'deaktivert'}`);
  };
  
  // Toggle WEBSITE LOCKDOWN mode (ingen tilgang)
  const toggleWebsiteLockdown = () => {
    const newSettings = {
      ...localSettings,
      fullLockdown: !localSettings.fullLockdown
    };
    
    updateSettings(newSettings);
    setMelding(`WEBSITE LOCKDOWN er nå ${newSettings.fullLockdown ? 'aktivert' : 'deaktivert'}`);
  };
  
  // Legg til NOTE på forsiden
  const handleNoteSubmit = (e) => {
    e.preventDefault();
    if (noteText.trim()) {
      const newSettings = {
        ...localSettings,
        note: noteText
      };
      
      updateSettings(newSettings);
      setMelding('NOTE er lagt til på forsiden');
      setNoteText('');
    } else {
      setFeilmelding('Skriv inn tekst før du legger til NOTE');
    }
  };
  
  // Fjern NOTE
  const removeNote = () => {
    const newSettings = {
      ...localSettings,
      note: ""
    };
    
    updateSettings(newSettings);
    setMelding('NOTE er fjernet fra forsiden');
  };
  
  // Passordsjekk før tilgang til panel
  if (!erAutentisert) {
    return (
      <div className="admin-container">
        <h1>Teknisk leder - Tilgangskontroll</h1>
        <p>Skriv inn passordet ditt for å få tilgang til Website panel.</p>
        
        {feilmelding && <div className="error-message">{feilmelding}</div>}
        
        <form onSubmit={handlePassordSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">Passord:</label>
            <input
              type="password"
              id="password"
              value={passordInput}
              onChange={(e) => setPassordInput(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn">Logg inn</button>
        </form>
      </div>
    );
  }
  
  return (
    <div className="website-panel">
      <h1>Website Panel - Teknisk leder</h1>
      <p className="welcome-text">Velkommen, {innloggetBruker.navn}. Her kan du styre tekniske aspekter av nettsiden.</p>
      
      {melding && <div className="success-message">{melding}</div>}
      {feilmelding && <div className="error-message">{feilmelding}</div>}
      
      <div className="panel-content">
        <div className="panel-section">
          <h2>Nettsidekontroll</h2>
          
          <div className="control-buttons">
            <div className="control-item">
              <button 
                className={`btn ${localSettings.lockdown ? 'btn-danger' : 'btn-primary'}`}
                onClick={toggleLockdown}
              >
                {localSettings.lockdown ? 'DEAKTIVER LOCKDOWN' : 'AKTIVER LOCKDOWN'}
              </button>
              <p className="control-description">
                LOCKDOWN: Når aktivert, kan brukere bare lese artikler. Admin-paneler er utilgjengelige og nye artikler kan ikke opprettes.
              </p>
            </div>
            
            <div className="control-item">
              <button 
                className={`btn ${localSettings.fullLockdown ? 'btn-danger' : 'btn-warning'}`}
                onClick={toggleWebsiteLockdown}
              >
                {localSettings.fullLockdown ? 'DEAKTIVER WEBSITE LOCKDOWN' : 'AKTIVER WEBSITE LOCKDOWN'}
              </button>
              <p className="control-description">
                WEBSITE LOCKDOWN: Når aktivert, vises bare en vedlikeholdsmelding på nettsiden. Ingen tilgang til innhold.
              </p>
            </div>
          </div>
        </div>
        
        <div className="panel-section">
          <h2>Forsidemelding (NOTE)</h2>
          
          <form onSubmit={handleNoteSubmit} className="note-form">
            <div className="form-group">
              <label htmlFor="noteText">Meldingstekst:</label>
              <textarea
                id="noteText"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows="4"
                placeholder="Skriv en viktig melding som skal vises på forsiden..."
              ></textarea>
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-primary">Legg til NOTE</button>
              {localSettings.note && (
                <button type="button" className="btn btn-secondary" onClick={removeNote}>Fjern NOTE</button>
              )}
            </div>
          </form>
          
          {localSettings.note && (
            <div className="preview-note">
              <h3>Forhåndsvisning av NOTE:</h3>
              <div className="note-content">{localSettings.note}</div>
            </div>
          )}
        </div>
        
        <div className="panel-section">
          <h2>Nåværende tilstand</h2>
          <ul className="status-list">
            <li>
              <strong>LOCKDOWN Status:</strong> 
              <span className={localSettings.lockdown ? 'status-active' : 'status-inactive'}>
                {localSettings.lockdown ? 'AKTIV' : 'INAKTIV'}
              </span>
            </li>
            <li>
              <strong>WEBSITE LOCKDOWN Status:</strong> 
              <span className={localSettings.fullLockdown ? 'status-active' : 'status-inactive'}>
                {localSettings.fullLockdown ? 'AKTIV' : 'INAKTIV'}
              </span>
            </li>
            <li>
              <strong>NOTE Status:</strong> 
              <span className={localSettings.note ? 'status-active' : 'status-inactive'}>
                {localSettings.note ? 'VISES PÅ FORSIDEN' : 'INGEN NOTE'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .website-panel {
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
          background: #f5f7f9;
          min-height: 100vh;
        }

        h1 {
          color: #2c3e50;
          margin-bottom: 30px;
          font-size: 2rem;
          text-align: center;
        }

        h2 {
          color: #34495e;
          margin-bottom: 20px;
          font-size: 1.5rem;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }

        h3 {
          color: #2c3e50;
          margin: 20px 0 15px;
          font-size: 1.2rem;
        }

        .welcome-text {
          text-align: center;
          color: #7f8c8d;
          margin-bottom: 30px;
          font-size: 1.1rem;
        }

        .panel-content {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .panel-section {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .panel-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.1);
        }

        .control-buttons {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .control-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .control-description {
          color: #7f8c8d;
          font-size: 0.95rem;
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          margin: 0;
        }

        .btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-danger {
          background: #e74c3c;
          color: white;
        }

        .btn-warning {
          background: #f1c40f;
          color: #2c3e50;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
          margin-left: 10px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #2c3e50;
          font-weight: 600;
        }

        textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          resize: vertical;
        }

        textarea:focus {
          outline: none;
          border-color: #3498db;
        }

        .button-group {
          display: flex;
          gap: 10px;
        }

        .preview-note {
          margin-top: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
        }

        .note-content {
          color: #2c3e50;
          font-size: 1rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .status-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .status-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          color: #2c3e50;
        }

        .status-active {
          color: #27ae60;
          font-weight: 600;
        }

        .status-inactive {
          color: #7f8c8d;
        }

        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .website-panel {
            padding: 20px;
          }

          .panel-section {
            padding: 20px;
          }

          .btn {
            width: 100%;
          }

          .button-group {
            flex-direction: column;
          }

          .btn-secondary {
            margin-left: 0;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default WebsitePanel; 