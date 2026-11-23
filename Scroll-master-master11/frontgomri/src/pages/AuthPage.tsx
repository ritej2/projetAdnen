import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  professionalToast as toast,
  showProfessionalErrorModal,
  showProfessionalSuccessModal,
} from '../services/alertService';
import { useAuth } from '../contexts/AuthContext';
import { RoleUtilisateur } from '../types';
import api from '../services/api';

const CANDIDATE_PHOTO_PRESETS = [
  '/images/resource/candidate-1.png',
  '/images/resource/candidate-2.png',
  '/images/resource/candidate-3.png',
  '/images/resource/candidate-4.png',
];

const COMPANY_LOGO_PRESETS = [
  '/images/resource/company-logo/1-3.png',
  '/images/resource/company-logo/3-1.png',
  '/images/resource/company-1.png',
  '/images/resource/company-2.png',
];

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const initialRole = searchParams.get('role') === 'ENTREPRISE' ? 'ENTREPRISE' : 'CANDIDAT';

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'CANDIDAT' | 'ENTREPRISE'>(initialRole);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [secteur, setSecteur] = useState('');
  const [titreProfil, setTitreProfil] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const { loginWithEmail, registerUser, loginAsDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleImageUpload = async (file: File, type: 'logo' | 'photo') => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/api/files/upload-public?type=${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        if (type === 'logo') setLogoUrl(res.data.url);
        else setPhotoUrl(res.data.url);
        toast.success(type === 'logo' ? 'Logo téléversé avec succès !' : 'Photo de profil téléversée !');
        return;
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        if (type === 'logo') setLogoUrl(b64);
        else setPhotoUrl(b64);
        toast.success(type === 'logo' ? 'Logo chargé !' : 'Photo chargée !');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    setMode(searchParams.get('mode') === 'register' ? 'register' : 'login');
    if (searchParams.get('role') === 'ENTREPRISE') {
      setRole('ENTREPRISE');
    } else if (searchParams.get('role') === 'CANDIDAT') {
      setRole('CANDIDAT');
    }
  }, [searchParams]);

  const redirectByRole = (r: RoleUtilisateur) => {
    if (r === 'ADMIN') navigate('/admin');
    else if (r === 'ENTREPRISE') navigate('/entreprise');
    else navigate('/candidat');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const u = await loginWithEmail(email, password);
        await showProfessionalSuccessModal(
          `Bienvenue, ${u.nom} !`,
          `Vous êtes connecté à votre espace ${u.role}.`
        );
        redirectByRole(u.role);
      } else {
        const u = await registerUser({
          nom,
          email,
          password,
          telephone,
          role,
          nomEntreprise: role === 'ENTREPRISE' ? nomEntreprise || nom : undefined,
          secteur: role === 'ENTREPRISE' ? secteur || 'Technologie & Services' : undefined,
          titreProfil: role === 'CANDIDAT' ? titreProfil || 'Ingénieur Logiciel' : undefined,
          logoUrl: role === 'ENTREPRISE' ? logoUrl || undefined : undefined,
          photoUrl: role === 'CANDIDAT' ? photoUrl || undefined : undefined,
        });
        await showProfessionalSuccessModal(
          'Compte créé avec succès !',
          `Votre espace ${u.role} est prêt, ${u.nom}.`
        );
        redirectByRole(u.role);
      }
    } catch (err: any) {
      await showProfessionalErrorModal(
        mode === 'login' ? 'Connexion impossible' : 'Inscription incomplète',
        err,
        'Veuillez vérifier votre adresse e-mail et votre mot de passe.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (demoRole: RoleUtilisateur) => {
    setLoading(true);
    try {
      const u = await loginAsDemoRole(demoRole);
      toast.success(`Connecté sur le compte ${u.nom}`);
      redirectByRole(u.role);
    } catch {
      toast.error('Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccountLogin = async (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('Password123!');
    setLoading(true);
    try {
      const u = await loginWithEmail(targetEmail, 'Password123!');
      toast.success(`Connecté en 1 clic sur le compte de ${u.nom} (${u.role})`);
      redirectByRole(u.role);
    } catch (err) {
      await showProfessionalErrorModal(
        'Connexion impossible',
        err,
        'Impossible de charger ce compte de démonstration.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillRegister = () => {
    const suffix = Math.floor(100 + Math.random() * 900);
    if (role === 'CANDIDAT') {
      setNom(`Karim Mansouri`);
      setTelephone('+33 6 52 44 18 90');
      setTitreProfil('Senior Full Stack Engineer (Java 21 / React 19)');
      setPhotoUrl('/images/resource/candidate-1.png');
      setEmail(`karim.mansouri.${suffix}@talentflow.io`);
      setPassword('Password123!');
    } else {
      setNom('Nadia Belkacem');
      setTelephone('+33 1 84 20 55 10');
      setNomEntreprise(`Quantum Cloud Lab ${suffix}`);
      setSecteur('Cloud Computing & Intelligence Artificielle');
      setLogoUrl('/images/resource/company-logo/1-3.png');
      setEmail(`contact.${suffix}@quantumcloud.io`);
      setPassword('Password123!');
    }
    toast.success('Formulaire d’inscription pré-rempli en 1 clic !');
  };

  return (
    <section className="ls-section" style={{ background: '#f5f7fc', padding: '60px 0' }}>
      <div className="auto-container">
        <div className="row justify-content-center">
          <div className="col-lg-7 col-md-10 col-sm-12">
            <div
              className="login-form default-form"
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '45px',
                boxShadow: '0 6px 15px rgba(64, 79, 104, 0.05)',
              }}
            >
              <div className="form-inner">
                <h3>
                  {mode === 'login' ? 'Connexion à Superio' : 'Créer un compte sur Superio'}
                </h3>

                {/* Switch Login / Register */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`theme-btn ${
                      mode === 'login' ? 'btn-style-one' : 'btn-style-three'
                    }`}
                  >
                    Se connecter
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`theme-btn ${
                      mode === 'register' ? 'btn-style-one' : 'btn-style-three'
                    }`}
                  >
                    S’inscrire
                  </button>
                </div>

                {mode === 'register' && (
                  <>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
                      <button
                        type="button"
                        onClick={() => setRole('CANDIDAT')}
                        className={`theme-btn ${
                          role === 'CANDIDAT' ? 'btn-style-four' : 'btn-style-three'
                        }`}
                        style={{ flex: 1 }}
                      >
                        <i className="la la-user"></i> Candidat
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('ENTREPRISE')}
                        className={`theme-btn ${
                          role === 'ENTREPRISE' ? 'btn-style-four' : 'btn-style-three'
                        }`}
                        style={{ flex: 1 }}
                      >
                        <i className="la la-briefcase"></i> Entreprise
                      </button>
                    </div>
                    <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={handleQuickFillRegister}
                        className="theme-btn btn-style-three"
                        style={{
                          padding: '8px 16px',
                          fontSize: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        ⚡ Pré-remplir Inscription Démo (1 clic)
                      </button>
                    </div>
                  </>
                )}

                <form onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <>
                      <div className="form-group">
                        <label>Nom complet *</label>
                        <input
                          type="text"
                          required
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          placeholder="Votre nom et prénom"
                        />
                      </div>

                      <div className="form-group">
                        <label>Numéro de téléphone</label>
                        <input
                          type="text"
                          value={telephone}
                          onChange={(e) => setTelephone(e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>

                      {role === 'ENTREPRISE' ? (
                        <>
                          <div className="row">
                            <div className="form-group col-md-6">
                              <label>Nom de l’entreprise *</label>
                              <input
                                type="text"
                                required
                                value={nomEntreprise}
                                onChange={(e) => setNomEntreprise(e.target.value)}
                                placeholder="Nom de votre société"
                              />
                            </div>
                            <div className="form-group col-md-6">
                              <label>Secteur d’activité</label>
                              <input
                                type="text"
                                value={secteur}
                                onChange={(e) => setSecteur(e.target.value)}
                                placeholder="Informatique, Finance..."
                              />
                            </div>
                          </div>

                          {/* Logo de l'entreprise */}
                          <div className="form-group" style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              🏢 Logo de l’entreprise
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>(téléversez un logo ou choisissez un modèle)</span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                              <div style={{ width: '64px', height: '64px', borderRadius: '10px', border: '2px dashed #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {logoUrl ? (
                                  <img src={logoUrl} alt="Logo Entreprise" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ fontSize: '24px' }}>🏢</span>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: '200px' }}>
                                <label className="theme-btn btn-style-three" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  {uploadingImage ? 'Téléversement...' : '📁 Téléverser un logo'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(file, 'logo');
                                    }}
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={logoUrl}
                                  onChange={(e) => setLogoUrl(e.target.value)}
                                  placeholder="Ou collez l’URL du logo (https://...)"
                                  style={{ fontSize: '12px', padding: '8px 12px', height: 'auto', background: '#fff' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Logos suggérés :</span>
                              {COMPANY_LOGO_PRESETS.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setLogoUrl(preset)}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    border: logoUrl === preset ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                    background: '#fff',
                                    padding: '3px',
                                    cursor: 'pointer',
                                  }}
                                  title={`Logo #${idx + 1}`}
                                >
                                  <img src={preset} alt="preset logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="form-group">
                            <label>Titre professionnel</label>
                            <input
                              type="text"
                              value={titreProfil}
                              onChange={(e) => setTitreProfil(e.target.value)}
                              placeholder="Ex: Développeur Full Stack Java / React"
                            />
                          </div>

                          {/* Photo de profil Candidat */}
                          <div className="form-group" style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              👤 Photo de profil
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>(téléversez une photo ou choisissez un avatar)</span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px dashed #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {photoUrl ? (
                                  <img src={photoUrl} alt="Photo Candidat" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '24px' }}>👤</span>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: '200px' }}>
                                <label className="theme-btn btn-style-three" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  {uploadingImage ? 'Téléversement...' : '📷 Téléverser une photo'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(file, 'photo');
                                    }}
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={photoUrl}
                                  onChange={(e) => setPhotoUrl(e.target.value)}
                                  placeholder="Ou collez l’URL de votre photo (https://...)"
                                  style={{ fontSize: '12px', padding: '8px 12px', height: 'auto', background: '#fff' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Avatars suggérés :</span>
                              {CANDIDATE_PHOTO_PRESETS.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setPhotoUrl(preset)}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    border: photoUrl === preset ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                    background: '#fff',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                  }}
                                  title={`Avatar #${idx + 1}`}
                                >
                                  <img src={preset} alt="preset avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="form-group">
                    <label>Adresse e-mail *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@domaine.fr"
                    />
                  </div>

                  <div className="form-group">
                    <label>Mot de passe *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mot de passe"
                    />
                  </div>

                  <div className="form-group">
                    <button
                      className="theme-btn btn-style-one"
                      type="submit"
                      disabled={loading}
                      style={{ width: '100%' }}
                    >
                      {loading
                        ? 'Chargement...'
                        : mode === 'login'
                        ? 'Se connecter'
                        : 'Créer mon compte'}
                    </button>
                  </div>
                </form>

                {mode === 'login' && (
                  <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>
                      ⚡ Accès direct Démo & Évaluation (1 clic) :
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleDemoAccess('ADMIN')}
                        className="theme-btn btn-style-three"
                        style={{
                          background: '#fef2f2',
                          borderColor: '#fca5a5',
                          color: '#b91c1c',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '10px',
                        }}
                      >
                        🛡️ Compte Administrateur (admin@talentflow.io)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoAccess('ENTREPRISE')}
                        className="theme-btn btn-style-three"
                        style={{
                          background: '#f0fdf4',
                          borderColor: '#86efac',
                          color: '#15803d',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '10px',
                        }}
                      >
                        🏢 Compte Entreprise (recrutement@novastudio.io)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDemoAccess('CANDIDAT')}
                        className="theme-btn btn-style-three"
                        style={{
                          background: '#eff6ff',
                          borderColor: '#93c5fd',
                          color: '#1d4ed8',
                          fontWeight: 700,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '10px',
                        }}
                      >
                        👨‍💼 Compte Candidat (marie.dubois@talentflow.io)
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulaire de connexion / inscription classique */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
