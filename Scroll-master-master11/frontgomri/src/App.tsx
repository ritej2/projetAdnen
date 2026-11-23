import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { PublicLayout } from './layouts/MainLayouts';
import { LandingPage } from './pages/LandingPage';
import { JobsCatalogPage, JobDetailPage, CompaniesDirectoryPage } from './pages/JobsPages';
import { AuthPage } from './pages/AuthPage';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import api from './services/api';

const DatabaseViewerPage: React.FC = () => {
  const [tables, setTables] = useState<Record<string, any[]>>({});
  const [activeTable, setActiveTable] = useState<string>('utilisateurs');
  const [loading, setLoading] = useState(true);

  const loadDb = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/bd');
      setTables(res.data || {});
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDb();
  }, []);

  const tableNames = Object.keys(tables);
  const currentRows = tables[activeTable] || [];

  return (
    <PublicLayout>
      <section className="page-title">
        <div className="auto-container">
          <div className="title-outer">
            <h1>Centre de Données & Synchronisation Cloud — JobFlow Enterprise</h1>
            <ul className="page-breadcrumb">
              <li>
                <Link to="/">Accueil</Link>
              </li>
              <li>Explorateur Haute Disponibilité & Tables Métier</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ls-section">
        <div className="auto-container">
          <div className="ls-widget" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div className="jf-live-pill">
                  <span className="jf-live-dot"></span>
                  Serveur de Données Haute Performance Actif · Synchronisation Métier Temps Réel
                </div>
                <h4 style={{ margin: 0, fontWeight: 600 }}>
                  Tables Métier de la plateforme ({tableNames.length} tables synchronisées)
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#696969' }}>
                  Consultez la structure des tables et l’intégrité des enregistrements métier en direct.
                </p>
              </div>
              <button
                onClick={loadDb}
                className="theme-btn btn-style-one"
                style={{ padding: '10px 20px', border: 'none', cursor: 'pointer' }}
              >
                <i className="la la-sync" style={{ marginRight: '6px' }}></i>
                Actualiser les données
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '25px' }}>
              {tableNames.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTable(t)}
                  className={
                    activeTable === t ? 'theme-btn btn-style-one' : 'theme-btn btn-style-three'
                  }
                  style={{ padding: '10px 18px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '13px' }}
                >
                  {t} ({(tables[t] || []).length})
                </button>
              ))}
            </div>

            {loading ? (
              <p>Chargement des tables SQL...</p>
            ) : currentRows.length === 0 ? (
              <p>Aucun enregistrement dans la table <strong>{activeTable}</strong>.</p>
            ) : (
              <div className="table-outer" style={{ overflowX: 'auto' }}>
                <table className="default-table manage-job-table">
                  <thead>
                    <tr>
                      {Object.keys(currentRows[0]).map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {val === null || val === undefined ? 'NULL' : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

const FirebaseConsolePage: React.FC = () => {
  const [fb, setFb] = useState<any>({ authUsers: [], storageCvs: [], storageLogos: [] });

  const loadFirebase = async () => {
    try {
      const res = await api.get('/api/firebase');
      setFb(res.data || { authUsers: [], storageCvs: [], storageLogos: [] });
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadFirebase();
  }, []);

  return (
    <PublicLayout>
      <section className="page-title">
        <div className="auto-container">
          <div className="title-outer">
            <h1>Console Firebase — Authentication & Storage</h1>
            <ul className="page-breadcrumb">
              <li>
                <Link to="/">Accueil</Link>
              </li>
              <li>Firebase (Identités & Stockage)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ls-section">
        <div className="auto-container">
          <div className="ls-widget" style={{ padding: '30px', marginBottom: '25px' }}>
            <h4 style={{ marginBottom: '15px', fontWeight: 600 }}>
              🔐 Firebase Authentication — Comptes & Firebase UIDs ({(fb.authUsers || []).length})
            </h4>
            <div className="table-outer" style={{ overflowX: 'auto' }}>
              <table className="default-table manage-job-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Fournisseur</th>
                    <th>Firebase UID</th>
                    <th>Nom & Rôle</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {(fb.authUsers || []).map((u: any) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.email}</strong>
                      </td>
                      <td>Email / Password</td>
                      <td>
                        <code style={{ background: '#e8f0fe', color: '#1967d2', padding: '4px 8px', borderRadius: '6px' }}>
                          {u.firebase_uid}
                        </code>
                      </td>
                      <td>
                        {u.nom} ({u.role})
                      </td>
                      <td>
                        <span className="status">{u.actif ? 'Activé' : 'Désactivé'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ls-widget" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '15px', fontWeight: 600 }}>
              📁 Firebase Storage Bucket (`gs://superio-talentflow-fr.appspot.com`)
            </h4>
            <div className="table-outer" style={{ overflowX: 'auto' }}>
              <table className="default-table manage-job-table">
                <thead>
                  <tr>
                    <th>Chemin Firebase Storage</th>
                    <th>Type</th>
                    <th>Propriétaire</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(fb.storageCvs || []).map((cv: any) => (
                    <tr key={`cv-${cv.id}`}>
                      <td>
                        <code>cvs/{cv.firebase_uid}/cv_candidat.pdf</code>
                      </td>
                      <td>Document PDF (CV)</td>
                      <td>{cv.nom}</td>
                      <td>
                        <a
                          href={cv.cv_url}
                          target="_blank"
                          rel="noreferrer"
                          className="theme-btn btn-style-one"
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                        >
                          Ouvrir le CV PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                  {(fb.storageLogos || []).map((logo: any) => (
                    <tr key={`logo-${logo.id}`}>
                      <td>
                        <code>logos/{logo.firebase_uid}/logo.png</code>
                      </td>
                      <td>Image (Logo Entreprise)</td>
                      <td>{logo.nom_entreprise}</td>
                      <td>
                        <a
                          href={logo.logo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="theme-btn btn-style-three"
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                        >
                          Voir le Logo
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
          {/* Public Website Routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <LandingPage />
              </PublicLayout>
            }
          />
          <Route
            path="/offres"
            element={
              <PublicLayout>
                <JobsCatalogPage />
              </PublicLayout>
            }
          />
          <Route
            path="/offres/:id"
            element={
              <PublicLayout>
                <JobDetailPage />
              </PublicLayout>
            }
          />
          <Route
            path="/entreprises"
            element={
              <PublicLayout>
                <CompaniesDirectoryPage />
              </PublicLayout>
            }
          />
          <Route
            path="/auth"
            element={
              <PublicLayout>
                <AuthPage />
              </PublicLayout>
            }
          />

          {/* Direct Database & Firebase Explorer Routes */}
          <Route path="/bd" element={<DatabaseViewerPage />} />
          <Route path="/firebase" element={<FirebaseConsolePage />} />

          {/* Role-Based Dashboards */}
          <Route path="/candidat/*" element={<CandidateDashboard />} />
          <Route path="/dashboard/candidat/*" element={<CandidateDashboard />} />
          <Route path="/entreprise/*" element={<CompanyDashboard />} />
          <Route path="/dashboard/entreprise/*" element={<CompanyDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/dashboard/admin/*" element={<AdminDashboard />} />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </LanguageProvider>
  );
}
