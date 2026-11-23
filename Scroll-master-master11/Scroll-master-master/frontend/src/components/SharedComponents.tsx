import React from 'react';
import { Link } from 'react-router-dom';
import { Offre, StatutCandidature, StatutEntretien, StatutOffre } from '../types';
import { Tilt3DCard } from './ThreeScene';

export const StatusBadge: React.FC<{
  status: StatutCandidature | StatutOffre | StatutEntretien | string;
}> = ({ status }) => {
  const styles: Record<string, { label: string; bg: string; color: string }> = {
    EN_ATTENTE: { label: 'En attente', bg: 'rgba(249, 171, 0, 0.15)', color: '#d97706' },
    EN_COURS_EXAMEN: { label: 'En cours d’examen', bg: 'rgba(25, 103, 210, 0.15)', color: '#1967d2' },
    ENTRETIEN: { label: 'Entretien planifié', bg: 'rgba(25, 103, 210, 0.18)', color: '#1967d2' },
    ACCEPTEE: { label: 'Acceptée', bg: 'rgba(52, 168, 83, 0.15)', color: '#34a853' },
    REFUSEE: { label: 'Refusée', bg: 'rgba(217, 48, 37, 0.15)', color: '#d93025' },
    RETIREE: { label: 'Retirée', bg: '#f1f5f9', color: '#64748b' },
    ACTIVE: { label: 'Active', bg: 'rgba(52, 168, 83, 0.15)', color: '#34a853' },
    BROUILLON: { label: 'Brouillon', bg: '#f1f5f9', color: '#64748b' },
    FERMEE: { label: 'Clôturée', bg: '#f1f5f9', color: '#64748b' },
    ARCHIVEE: { label: 'Archivée', bg: '#f1f5f9', color: '#64748b' },
    SUSPENDUE: { label: 'Suspendue', bg: 'rgba(217, 48, 37, 0.15)', color: '#d93025' },
    PLANIFIE: { label: 'Planifié', bg: 'rgba(25, 103, 210, 0.15)', color: '#1967d2' },
    TERMINE: { label: 'Terminé', bg: 'rgba(52, 168, 83, 0.15)', color: '#34a853' },
    ANNULE: { label: 'Annulé', bg: 'rgba(217, 48, 37, 0.15)', color: '#d93025' },
  };

  const entry = styles[status] || { label: status, bg: '#eef2f6', color: '#363636' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 14px',
        borderRadius: '30px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: entry.bg,
        color: entry.color,
      }}
    >
      {entry.label}
    </span>
  );
};

export const formatSalaryRange = (min?: number, max?: number): string => {
  if (!min && !max) return 'Selon profil';
  const fmt = (n: number) => `${Math.round(n / 1000)}k €`;
  if (min && max && max > min) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}`;
  return `${fmt(max!)}`;
};

const COMPANY_LOGOS = [
  '/images/resource/company-logo/1-3.png',
  '/images/resource/company-logo/3-1.png',
  '/images/resource/company-logo/3-6.png',
  '/images/resource/company-1.png',
  '/images/resource/company-2.png',
  '/images/resource/company-3.png',
];

export const getCompanyLogo = (offre: Offre): string => {
  if (offre.logoEntreprise) return offre.logoEntreprise;
  const idx = (offre.entrepriseId || offre.id || 0) % COMPANY_LOGOS.length;
  return COMPANY_LOGOS[idx];
};

const CANDIDATE_AVATARS = [
  '/images/resource/candidate-1.png',
  '/images/resource/candidate-2.png',
  '/images/resource/candidate-3.png',
  '/images/resource/candidate-4.png',
];

export const getCandidateAvatar = (id?: number): string => {
  const idx = ((id || 1) - 1) % CANDIDATE_AVATARS.length;
  return CANDIDATE_AVATARS[Math.max(0, idx)];
};

interface JobCardProps {
  offre: Offre;
  isFavorite?: boolean;
  onToggleFavorite?: (offreId: number) => void;
  hasApplied?: boolean;
}

export const JobOfferCard: React.FC<JobCardProps> = ({
  offre,
  isFavorite = false,
  onToggleFavorite,
  hasApplied = false,
}) => {
  const logoSrc = getCompanyLogo(offre);

  return (
    <div className="job-block" style={{ marginBottom: '25px' }}>
      <Tilt3DCard className="inner-box" intensity={5}>
        <div className="content">
          <span className="company-logo">
            <img
              src={logoSrc}
              alt={offre.nomEntreprise}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/resource/company-1.png';
              }}
              style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '8px' }}
            />
          </span>
          <h4>
            <Link to={`/offres/${offre.id}`}>{offre.titre}</Link>
          </h4>
          <ul className="job-info">
            <li>
              <span className="icon la la-briefcase"></span> {offre.nomEntreprise}
            </li>
            <li>
              <span className="icon la la-map-marker"></span> {offre.localisation}
            </li>
            <li>
              <span className="icon la la-clock"></span> {offre.datePublication}
            </li>
            <li>
              <span className="icon la la-euro"></span>{' '}
              {formatSalaryRange(offre.salaire, offre.salaireMax)}
            </li>
            <li>
              <span className="icon la la-users"></span> {offre.nombreCandidatures || 0} postulant(s)
            </li>
          </ul>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <ul className="job-other-info" style={{ margin: 0, padding: 0 }}>
              <li className="time">{offre.typeContrat}</li>
              {offre.modeTravail && <li className="privacy">{offre.modeTravail}</li>}
              {offre.categorie && <li className="required">{offre.categorie}</li>}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {hasApplied ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  <i className="la la-check-circle" style={{ fontSize: '15px' }}></i>
                  Déjà postulé
                </span>
              ) : (
                <Link
                  to={`/offres/${offre.id}?apply=true`}
                  className="theme-btn btn-style-one"
                  style={{ padding: '8px 20px', fontSize: '13px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
                >
                  <i className="la la-paper-plane" style={{ marginRight: '6px' }}></i>
                  Postuler
                </Link>
              )}
            </div>
          </div>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(offre.id);
              }}
              className="bookmark-btn"
              style={
                isFavorite
                  ? { backgroundColor: '#1967d2', color: '#ffffff', opacity: 1, visibility: 'visible' }
                  : { opacity: 1, visibility: 'visible' }
              }
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <span className="la la-bookmark"></span>
            </button>
          )}
        </div>
      </Tilt3DCard>
    </div>
  );
};

export const KpiCard: React.FC<{
  label: string;
  value: string | number;
  subtitle?: string;
  laIcon?: string;
  icon?: string | React.ReactNode;
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'blue' | 'red' | 'yellow' | 'green';
}> = ({ label, value, laIcon, icon, accent = 'indigo' }) => {
  const colorClass =
    accent === 'rose' || accent === 'red'
      ? 'ui-red'
      : accent === 'amber' || accent === 'yellow'
      ? 'ui-yellow'
      : accent === 'emerald' || accent === 'green'
      ? 'ui-green'
      : '';

  const iconClass =
    laIcon ||
    (typeof icon === 'string'
      ? icon.startsWith('la ')
        ? icon
        : `la ${icon}`
      : 'la la-briefcase');

  return (
    <div className="ui-block col-xl-3 col-lg-6 col-md-6 col-sm-12">
      <div className={`ui-item ${colorClass}`}>
        <div className="left">
          <i className={`icon ${iconClass}`}></i>
        </div>
        <div className="right">
          <h4>{value}</h4>
          <p>{label}</p>
        </div>
      </div>
    </div>
  );
};
