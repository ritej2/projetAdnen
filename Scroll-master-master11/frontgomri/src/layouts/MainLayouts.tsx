import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import {
  professionalToast as toast,
  showProfessionalSuccessModal,
} from '../services/alertService';
import { getCandidateAvatar } from '../components/SharedComponents';
import { uploadDocumentOrLogo } from '../services/storageService';

const AVATAR_PRESETS = [
  '/images/resource/candidate-1.png',
  '/images/resource/candidate-2.png',
  '/images/resource/candidate-3.png',
  '/images/resource/candidate-4.png',
  '/images/resource/company-1.png',
  '/images/resource/company-2.png',
];

export const getUserAvatarUrl = (
  userId?: number,
  role?: string,
  entrepriseLogo?: string,
  candidatPhoto?: string
): string => {
  const custom = localStorage.getItem(`jf_user_avatar_${userId || 0}`);
  if (custom) return custom;
  if (role === 'CANDIDAT') {
    if (candidatPhoto) return candidatPhoto;
    const legacy = localStorage.getItem('jf_candidate_avatar');
    if (legacy) return legacy;
  }
  if (role === 'ENTREPRISE' && entrepriseLogo) {
    return entrepriseLogo;
  }
  return getCandidateAvatar(userId || 1);
};

export const UniversalProfileModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { user, candidat, entreprise, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    titreProfil: '',
    adresse: '',
    competences: '',
    bio: '',
    nomEntreprise: '',
    secteur: '',
    siteWeb: '',
    description: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      nom: user.nom || '',
      email: user.email || '',
      telephone: user.telephone || '',
      titreProfil: candidat?.titreProfil || 'Ingénieur Logiciel Full Stack',
      adresse: candidat?.adresse || entreprise?.adresse || 'Paris, France',
      competences:
        candidat?.competences || 'Java 21, Spring Boot 3, React 19, TypeScript, MySQL',
      bio:
        candidat?.bio ||
        'Professionnel passionné par le développement logiciel et l’innovation cloud.',
      nomEntreprise: entreprise?.nomEntreprise || user.nom || '',
      secteur: entreprise?.secteur || 'Technologie & Cloud',
      siteWeb: entreprise?.siteWeb || 'https://jobflow.io',
      description:
        entreprise?.description ||
        'Entreprise technologique partenaire sur la plateforme JobFlow.',
      avatarUrl: getUserAvatarUrl(user.id, user.role, entreprise?.logoUrl),
    });
  }, [open, user, candidat, entreprise]);

  if (!open || !user) return null;

  const handleSelectAvatar = (url: string) => {
    setForm((prev) => ({ ...prev, avatarUrl: url }));
    localStorage.setItem(`jf_user_avatar_${user.id}`, url);
    if (user.role === 'CANDIDAT') {
      localStorage.setItem('jf_candidate_avatar', url);
    }
    window.dispatchEvent(new Event('jf-avatar-updated'));
    toast.success('Photo de profil sélectionnée !');
  };

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadDocumentOrLogo(file, 'logo');
      handleSelectAvatar(res.url);
      await refreshProfile();
    } catch (err: any) {
      toast.error(err, 'Téléchargement de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/users/me', {
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        titreProfil: form.titreProfil,
        adresse: form.adresse,
        competences: form.competences,
        bio: form.bio,
        nomEntreprise: form.nomEntreprise,
        secteur: form.secteur,
        siteWeb: form.siteWeb,
        description: form.description,
      });

      if (user.role === 'ENTREPRISE' && form.avatarUrl) {
        try {
          await api.patch('/api/entreprises/me/logo', { logoUrl: form.avatarUrl });
        } catch {
          // ignore
        }
      }

      await refreshProfile();
      window.dispatchEvent(new Event('jf-avatar-updated'));
      onClose();
      await showProfessionalSuccessModal(
        'Profil mis à jour avec succès !',
        `Les informations de ${form.nom} (${user.role}) ont bien été enregistrées dans la base de données MySQL.`
      );
    } catch (err) {
      toast.error(err, 'Mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="superio-modal-backdrop" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="superio-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '12px',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              ✏️ Modifier mon profil ({user.role})
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Modifiez vos informations personnelles, votre photo et vos coordonnées en direct
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Photo / Avatar Picker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={form.avatarUrl}
              alt={form.nom}
              style={{
                width: '64px',
                height: '64px',
                minWidth: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #4f46e5',
                background: '#fff',
              }}
            />
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                {form.nom}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                {form.email} · Rôle : <strong>{user.role}</strong>
              </div>
              <label
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: '#eef2ff',
                  color: '#4f46e5',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {uploadingPhoto ? 'Importation...' : '📷 Importer une photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
              Choisir un avatar en 1 clic :
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {AVATAR_PRESETS.map((av, idx) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => handleSelectAvatar(av)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    padding: 0,
                    overflow: 'hidden',
                    border: form.avatarUrl === av ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                    cursor: 'pointer',
                    background: '#fff',
                  }}
                  title={`Avatar #${idx + 1}`}
                >
                  <img
                    src={av}
                    alt={`Avatar ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="default-form">
          <div className="row">
            <div className="form-group col-lg-6 col-md-12">
              <label>Nom complet *</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Adresse e-mail *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Téléphone</label>
              <input
                type="text"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {user.role !== 'ADMIN' && (
              <div className="form-group col-lg-6 col-md-12">
                <label>Ville / Adresse</label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                />
              </div>
            )}

            {user.role === 'CANDIDAT' && (
              <>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Titre professionnel</label>
                  <input
                    type="text"
                    value={form.titreProfil}
                    onChange={(e) => setForm({ ...form, titreProfil: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Compétences clés</label>
                  <input
                    type="text"
                    value={form.competences}
                    onChange={(e) => setForm({ ...form, competences: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Présentation / Bio</label>
                  <textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
              </>
            )}

            {user.role === 'ENTREPRISE' && (
              <>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Nom de l’entreprise</label>
                  <input
                    type="text"
                    value={form.nomEntreprise}
                    onChange={(e) => setForm({ ...form, nomEntreprise: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Secteur d’activité</label>
                  <input
                    type="text"
                    value={form.secteur}
                    onChange={(e) => setForm({ ...form, secteur: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Site Web</label>
                  <input
                    type="text"
                    value={form.siteWeb}
                    onChange={(e) => setForm({ ...form, siteWeb: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Description de l’entreprise</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="theme-btn btn-style-three"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="theme-btn btn-style-one"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              {saving ? 'Enregistrement...' : '💾 Enregistrer mon profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, candidat, entreprise, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('jf_theme') === 'dark');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [, setAvatarTick] = useState(0);

  useEffect(() => {
    const handler = () => setAvatarTick((t) => t + 1);
    window.addEventListener('jf-avatar-updated', handler);
    return () => window.removeEventListener('jf-avatar-updated', handler);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('jf-dark-mode');
      localStorage.setItem('jf_theme', 'dark');
    } else {
      document.body.classList.remove('jf-dark-mode');
      localStorage.setItem('jf_theme', 'light');
    }
  }, [darkMode]);

  const dashboardPath =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'ENTREPRISE'
      ? '/entreprise'
      : '/candidat';

  const handleProtectedLink = (
    e: React.MouseEvent,
    targetRole: 'CANDIDAT' | 'ENTREPRISE' | 'ADMIN',
    targetPath: string
  ) => {
    e.preventDefault();
    if (!user) {
      toast.info('Veuillez vous connecter pour accéder à cet espace.');
      navigate(`/auth?mode=login&role=${targetRole}`);
      return;
    }
    if (user.role !== targetRole && user.role !== 'ADMIN') {
      toast.warning(`Cet espace est réservé aux comptes ${targetRole}.`);
      navigate(dashboardPath);
      return;
    }
    navigate(targetPath);
  };

  return (
    <div className="page-wrapper jf-page-enter">
      {/* Main Header (Exact Superio Template Structure + 3D Glass Controls) */}
      <header className="main-header fixed-header">
        <div className="main-box">
          <div className="nav-outer">
            <div className="logo-box">
              <div className="logo">
                <Link to="/">
                  <img src="/images/logo.svg" alt="JobFlow Superio" title="JobFlow Superio" />
                </Link>
              </div>
            </div>

            <nav className="nav main-menu">
              <ul className="navigation" id="navbar">
                <li className={location.pathname === '/' ? 'current' : ''}>
                  <Link to="/">{t('navHome')}</Link>
                </li>
                <li className={location.pathname.startsWith('/offres') ? 'current' : ''}>
                  <Link to="/offres">{t('navJobs')}</Link>
                </li>
                <li className={location.pathname.startsWith('/entreprises') ? 'current' : ''}>
                  <Link to="/entreprises">{t('navCompanies')}</Link>
                </li>
                {user && (
                  <li className={location.pathname.startsWith(dashboardPath) ? 'current' : ''}>
                    <Link to={dashboardPath}>
                      {user.role === 'ADMIN'
                        ? 'Administration'
                        : user.role === 'ENTREPRISE'
                        ? 'Espace Recruteur'
                        : 'Mon Espace Candidat'}
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          <div className="outer-box" style={{ gap: '10px' }}>
            {/* Language Switcher Button (FR | AR) */}
            <button
              type="button"
              onClick={toggleLang}
              title={lang === 'fr' ? 'التحويل إلى العربية' : 'Passer en Français'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                background: darkMode ? 'rgba(30, 41, 59, 0.95)' : '#ffffff',
                color: '#4f46e5',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.12)',
              }}
            >
              {lang === 'fr' ? (
                <>
                  <span style={{ fontSize: '16px' }}>🇫🇷</span>
                  <strong style={{ color: '#4f46e5' }}>FR</strong>
                  <span style={{ color: '#cbd5e1', fontSize: '11px' }}>|</span>
                  <span style={{ color: '#94a3b8' }}>AR</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '16px' }}>🇸🇦</span>
                  <strong style={{ color: '#4f46e5' }}>العربية</strong>
                  <span style={{ color: '#cbd5e1', fontSize: '11px' }}>|</span>
                  <span style={{ color: '#94a3b8' }}>FR</span>
                </>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre 3D'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: darkMode ? 'rgba(30, 41, 59, 0.9)' : '#f8fafc',
                color: darkMode ? '#fbbf24' : '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                marginRight: '6px',
              }}
            >
              <i className={darkMode ? 'la la-sun' : 'la la-moon'}></i>
            </button>

            {/* Publier une offre adaptée au rôle ENTREPRISE uniquement */}
            {user?.role === 'ENTREPRISE' && (
              <a
                href="/entreprise"
                onClick={(e) => handleProtectedLink(e, 'ENTREPRISE', '/entreprise')}
                className="theme-btn btn-style-one"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                ➕ {lang === 'ar' ? 'نشر عرض عمل' : 'Publier une offre'}
              </a>
            )}

            <div className="btn-box" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(true)}
                    className="theme-btn btn-style-three"
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                    }}
                  >
                    <img
                      src={getUserAvatarUrl(user.id, user.role, entreprise?.logoUrl, candidat?.photoUrl)}
                      alt={user.nom}
                      style={{
                        width: '28px',
                        height: '28px',
                        minWidth: '28px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #4f46e5',
                      }}
                    />
                    <span>✏️ {t('navProfile')}</span>
                  </button>
                  <Link to={dashboardPath} className="theme-btn btn-style-three">
                    {t('navDashboard')}
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      toast.info(lang === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Vous avez été déconnecté.');
                      navigate('/');
                    }}
                    className="theme-btn btn-style-one"
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    {t('navLogout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=login" className="theme-btn btn-style-three">
                    {t('navLogin')}
                  </Link>
                  <Link to="/auth?mode=register" className="theme-btn btn-style-one">
                    {t('navRegister')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <span className="header-span" style={{ display: 'block', height: '85px' }}></span>

      <UniversalProfileModal
        open={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      {/* Page Body */}
      {children}

      {/* Main Footer (Exact Superio Template Footer in French) */}
      <footer className="main-footer">
        <div className="auto-container">
          <div className="widgets-section">
            <div className="row">
              <div className="big-column col-xl-4 col-lg-3 col-md-12">
                <div className="footer-column about-widget">
                  <div className="logo">
                    <Link to="/">
                      <img src="/images/logo.svg" alt="Superio" />
                    </Link>
                  </div>
                  <p className="phone-num">
                    <span>Appelez-nous </span>
                    <a href="tel:+33142685500">+33 1 42 68 55 00</a>
                  </p>
                  <p className="address">
                    42 Rue de Paradis, 75010 Paris, <br /> France. <br />
                    <a href="mailto:contact@superio-emploi.fr" className="email">
                      contact@superio-emploi.fr
                    </a>
                  </p>
                </div>
              </div>

              <div className="big-column col-xl-8 col-lg-9 col-md-12">
                <div className="row">
                  <div className="footer-column col-lg-3 col-md-6 col-sm-12">
                    <div className="footer-widget links-widget">
                      <h4 className="widget-title">Pour les Candidats</h4>
                      <div className="widget-content">
                        <ul className="list">
                          <li>
                            <Link to="/offres">Parcourir les offres</Link>
                          </li>
                          <li>
                            <Link to="/entreprises">Découvrir les entreprises</Link>
                          </li>
                          <li>
                            <a
                              href="/candidat"
                              onClick={(e) => handleProtectedLink(e, 'CANDIDAT', '/candidat')}
                            >
                              Espace Candidat
                            </a>
                          </li>
                          <li>
                            <a
                              href="/candidat"
                              onClick={(e) => handleProtectedLink(e, 'CANDIDAT', '/candidat')}
                            >
                              Mes candidatures
                            </a>
                          </li>
                          <li>
                            <a
                              href="/candidat"
                              onClick={(e) => handleProtectedLink(e, 'CANDIDAT', '/candidat')}
                            >
                              Mes offres favorites
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="footer-column col-lg-3 col-md-6 col-sm-12">
                    <div className="footer-widget links-widget">
                      <h4 className="widget-title">Pour les Entreprises</h4>
                      <div className="widget-content">
                        <ul className="list">
                          <li>
                            <a
                              href="/entreprise"
                              onClick={(e) => handleProtectedLink(e, 'ENTREPRISE', '/entreprise')}
                            >
                              Tableau de bord recruteur
                            </a>
                          </li>
                          <li>
                            <a
                              href="/entreprise"
                              onClick={(e) => handleProtectedLink(e, 'ENTREPRISE', '/entreprise')}
                            >
                              Publier une offre d’emploi
                            </a>
                          </li>
                          <li>
                            <a
                              href="/entreprise"
                              onClick={(e) => handleProtectedLink(e, 'ENTREPRISE', '/entreprise')}
                            >
                              Gérer les candidatures
                            </a>
                          </li>
                          <li>
                            <a
                              href="/entreprise"
                              onClick={(e) => handleProtectedLink(e, 'ENTREPRISE', '/entreprise')}
                            >
                              Planifier des entretiens
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="footer-column col-lg-3 col-md-6 col-sm-12">
                    <div className="footer-widget links-widget">
                      <h4 className="widget-title">Mon Compte</h4>
                      <div className="widget-content">
                        <ul className="list">
                          <li>
                            <Link to="/offres">Recherche d’emploi</Link>
                          </li>
                          <li>
                            <Link to="/auth?mode=login">Se connecter</Link>
                          </li>
                          <li>
                            <Link to="/auth?mode=register">Créer un compte</Link>
                          </li>
                          <li>
                            <a
                              href="/admin"
                              onClick={(e) => handleProtectedLink(e, 'ADMIN', '/admin')}
                            >
                              Espace Administrateur
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="footer-column col-lg-3 col-md-6 col-sm-12">
                    <div className="footer-widget links-widget">
                      <h4 className="widget-title">Ressources utiles</h4>
                      <div className="widget-content">
                        <ul className="list">
                          <li>
                            <a
                              href="http://localhost:8081/swagger-ui.html"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Documentation API (Swagger)
                            </a>
                          </li>
                          <li>
                            <Link to="/bd">Centre de Données & Synchro</Link>
                          </li>
                          <li>
                            <Link to="/firebase">Services Cloud & Documents</Link>
                          </li>
                          <li>
                            <Link to="/offres">Protection des CV (RGPD)</Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="auto-container">
            <div className="outer-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="copyright-text">
                © 2026 <Link to="/" style={{ fontWeight: 700, color: '#4f46e5' }}>JobFlow</Link>. Tous droits réservés.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface SidebarTab {
  id: string;
  label: string;
  laIcon?: string;
  icon?: string | React.ReactNode;
  badge?: number | string;
}

interface DashboardShellProps {
  title: string;
  subtitle: string;
  roleLabel: string;
  tabs: SidebarTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardShellProps> = ({
  title,
  subtitle,
  roleLabel,
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
}) => {
  const { user, candidat, entreprise, loading, logout, loginAsDemoRole } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('jf_theme') === 'dark');
  const [, setAvatarTick] = useState(0);

  useEffect(() => {
    const handler = () => setAvatarTick((t) => t + 1);
    window.addEventListener('jf-avatar-updated', handler);
    return () => window.removeEventListener('jf-avatar-updated', handler);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('jf-dark-mode');
      localStorage.setItem('jf_theme', 'dark');
    } else {
      document.body.classList.remove('jf-dark-mode');
      localStorage.setItem('jf_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!loading && !user) {
      toast.info('Veuillez vous connecter pour accéder à votre tableau de bord.');
      navigate('/auth?mode=login', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h4>Chargement de votre session...</h4>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`page-wrapper dashboard jf-page-enter ${sidebarOpen ? 'active-user-sidebar' : ''}`}>
      {/* Main Header (Exact Superio Dashboard Header + Role Switcher + Theme Toggle) */}
      <header className="main-header header-shaddow fixed-header">
        <div className="container-fluid">
          <div className="main-box">
            <div className="nav-outer">
              <div className="logo-box">
                <div className="logo">
                  <Link to="/">
                    <img src="/images/logo.svg" alt="Superio" title="Superio" />
                  </Link>
                </div>
              </div>

              <nav className="nav main-menu">
                <ul className="navigation" id="navbar">
                  <li>
                    <Link to="/">{lang === 'ar' ? 'الرئيسية' : 'Accueil'}</Link>
                  </li>
                  <li>
                    <Link to="/offres">{lang === 'ar' ? 'عروض العمل' : 'Offres d’emploi'}</Link>
                  </li>
                  <li>
                    <Link to="/entreprises">{lang === 'ar' ? 'الشركات' : 'Entreprises'}</Link>
                  </li>
                  <li className="current">
                    <span>
                      {lang === 'ar'
                        ? (user.role === 'ADMIN' ? 'لوحة الإدارة' : user.role === 'ENTREPRISE' ? 'فضاء الشركات' : 'فضاء المرشح')
                        : (user.role === 'ADMIN' ? 'Administration' : user.role === 'ENTREPRISE' ? 'Espace Recruteur' : 'Espace Candidat')}
                    </span>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="outer-box" style={{ gap: '8px' }}>
              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLang}
                title={lang === 'fr' ? 'التحويل إلى العربية' : 'Passer en Français'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  background: darkMode ? 'rgba(30, 41, 59, 0.95)' : '#ffffff',
                  color: '#4f46e5',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                {lang === 'fr' ? (
                  <>
                    <span>🇫🇷</span>
                    <strong>FR</strong>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ color: '#94a3b8' }}>AR</span>
                  </>
                ) : (
                  <>
                    <span>🇸🇦</span>
                    <strong>العربية</strong>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ color: '#94a3b8' }}>FR</span>
                  </>
                )}
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Mode clair' : 'Mode sombre 3D'}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  background: darkMode ? 'rgba(30, 41, 59, 0.9)' : '#f8fafc',
                  color: darkMode ? '#fbbf24' : '#334155',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '17px',
                }}
              >
                <i className={darkMode ? 'la la-sun' : 'la la-moon'}></i>
              </button>

              {user.role === 'CANDIDAT' && (
                <button
                  onClick={() => onTabChange('favorites')}
                  className="menu-btn"
                  title="Mes Favoris"
                >
                  <span className="icon la la-heart-o"></span>
                </button>
              )}

              {/* Dashboard Account Indicator & Dropdown Menu */}
              <div className="dropdown dashboard-option" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'transparent',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '40px',
                    padding: '5px 14px 5px 6px',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={getUserAvatarUrl(user.id, user.role, entreprise?.logoUrl, candidat?.photoUrl)}
                    alt={user.nom}
                    style={{
                      width: '40px',
                      height: '40px',
                      minWidth: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #4f46e5',
                      background: '#fff',
                    }}
                  />
                  <span
                    className="name"
                    style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: darkMode ? '#f8fafc' : '#1e293b',
                    }}
                  >
                    {user.nom}
                  </span>
                  <i
                    className={`la la-angle-${userDropdownOpen ? 'up' : 'down'}`}
                    style={{ fontSize: '13px', color: '#4f46e5' }}
                  ></i>
                </button>

                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '260px',
                      background: darkMode ? '#1e293b' : '#ffffff',
                      borderRadius: '14px',
                      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      padding: '8px',
                      zIndex: 9999,
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '14px', color: darkMode ? '#fff' : '#0f172a' }}>
                        {user.nom}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setShowEditProfileModal(true);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        border: 'none',
                        background: 'rgba(79, 70, 229, 0.08)',
                        color: '#4f46e5',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginBottom: '4px',
                      }}
                    >
                      <i className="la la-user-edit" style={{ marginRight: '8px', fontSize: '16px' }}></i>
                      {lang === 'ar' ? '✏️ تعديل الملف الشخصي' : '✏️ Modifier mon profil & photo'}
                    </button>

                    {tabs.some((t) => t.id === 'profile' || t.id === 'company-profile') && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          const targetTab = tabs.find(
                            (t) => t.id === 'profile' || t.id === 'company-profile'
                          );
                          if (targetTab) onTabChange(targetTab.id);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          border: 'none',
                          background: 'transparent',
                          color: darkMode ? '#e2e8f0' : '#334155',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <i className="la la-id-card" style={{ marginRight: '8px', fontSize: '16px' }}></i>
                        {lang === 'ar' ? 'الملف الشخصي والمستندات' : 'Onglet Profil & Documents'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onTabChange('overview');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        border: 'none',
                        background: 'transparent',
                        color: darkMode ? '#e2e8f0' : '#334155',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <i className="la la-home" style={{ marginRight: '8px', fontSize: '16px' }}></i>
                      {lang === 'ar' ? 'لوحة التحكم الرئيسية' : 'Tableau de bord principal'}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                        toast.info(lang === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Vous avez été déconnecté.');
                        navigate('/auth?mode=login');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        border: 'none',
                        background: 'transparent',
                        color: '#dc2626',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginTop: '4px',
                      }}
                    >
                      <i className="la la-sign-out" style={{ marginRight: '8px', fontSize: '16px' }}></i>
                      {lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowEditProfileModal(true)}
                className="theme-btn btn-style-three"
                style={{ marginLeft: '8px', padding: '10px 14px', border: 'none', cursor: 'pointer' }}
              >
                <i className="la la-user-edit" style={{ marginRight: '5px' }}></i>
                {lang === 'ar' ? 'تعديل الملف' : 'Modifier Profil'}
              </button>

              <button
                onClick={async () => {
                  await logout();
                  toast.info(lang === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Vous avez été déconnecté.');
                  navigate('/auth?mode=login');
                }}
                className="theme-btn btn-style-three"
                style={{ marginLeft: '8px', padding: '10px 16px', border: 'none', cursor: 'pointer' }}
              >
                <i className="la la-sign-out" style={{ marginRight: '5px' }}></i>
                {lang === 'ar' ? 'خروج' : 'Déconnexion'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <UniversalProfileModal
        open={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      {/* User Sidebar (Exact Superio `.user-sidebar`) */}
      <div className="user-sidebar">
        <div className="sidebar-inner">
          <ul className="navigation">
            {tabs.map((tab) => {
              const iconClass =
                tab.laIcon ||
                (typeof tab.icon === 'string'
                  ? tab.icon.startsWith('la ')
                    ? tab.icon
                    : `la ${tab.icon}`
                  : 'la la-home');

              return (
                <li key={tab.id} className={activeTab === tab.id ? 'active' : ''}>
                  <a
                    href={`#${tab.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onTabChange(tab.id);
                    }}
                  >
                    <i className={iconClass}></i> {tab.label}
                    {tab.badge !== undefined && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          background: '#1967d2',
                          color: '#fff',
                          borderRadius: '20px',
                          padding: '1px 8px',
                          fontSize: '11px',
                          float: 'right',
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}

            <li>
              <a
                href="#edit-profile"
                onClick={(e) => {
                  e.preventDefault();
                  setShowEditProfileModal(true);
                }}
              >
                <i className="la la-user-edit"></i> {lang === 'ar' ? 'تعديل الملف الشخصي' : 'Modifier mon profil'}
              </a>
            </li>
            <li>
              <Link to="/offres">
                <i className="la la-search"></i> {lang === 'ar' ? 'البحث عن عروض العمل' : 'Rechercher des offres'}
              </Link>
            </li>
            <li>
              <a
                href="#logout"
                onClick={async (e) => {
                  e.preventDefault();
                  await logout();
                  navigate('/auth?mode=login');
                  toast.info(lang === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Vous avez été déconnecté.');
                }}
              >
                <i className="la la-sign-out"></i> {lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* User Dashboard Section (Exact Superio `.user-dashboard`) */}
      <section className="user-dashboard">
        <div className="dashboard-outer">
          <div
            className="upper-title-box"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px',
            }}
          >
            <div>
              <h3>{title}</h3>
              <div className="text">{subtitle}</div>
            </div>
            {actions && <div>{actions}</div>}
          </div>

          {children}
        </div>
      </section>

      {/* Copyright */}
      <div className="copyright-text">
        <p>© 2026 Superio France. Tous droits réservés.</p>
      </div>
    </div>
  );
};
