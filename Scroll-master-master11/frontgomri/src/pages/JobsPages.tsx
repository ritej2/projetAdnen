import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  professionalToast as toast,
  showProfessionalErrorModal,
  showProfessionalSuccessModal,
} from '../services/alertService';
import api from '../services/api';
import { Entreprise, Favori, Offre } from '../types';
import {
  JobOfferCard,
  formatSalaryRange,
  getCompanyLogo,
} from '../components/SharedComponents';
import { useAuth } from '../contexts/AuthContext';
import { uploadDocumentOrLogo } from '../services/storageService';

export const JobsCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [offres, setOffres] = useState<Offre[]>([]);
  const [favoriIds, setFavoriIds] = useState<number[]>([]);
  const [appliedOfferIds, setAppliedOfferIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [localisation, setLocalisation] = useState(searchParams.get('localisation') || '');
  const [typeContrat, setTypeContrat] = useState(searchParams.get('typeContrat') || '');
  const [categorie, setCategorie] = useState(searchParams.get('categorie') || '');
  const [modeTravail, setModeTravail] = useState('');
  const [salaireMin, setSalaireMin] = useState(searchParams.get('salaireMin') || '');
  const [sortBy, setSortBy] = useState<'recent' | 'salary' | 'popular'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const fetchOffres = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { size: 50 };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (localisation.trim()) params.localisation = localisation.trim();
      if (typeContrat) params.typeContrat = typeContrat;
      if (categorie) params.categorie = categorie;
      if (salaireMin) params.salaireMin = Number(salaireMin);

      const res = await api.get('/api/offres', { params });
      setOffres(res.data.content || []);
    } catch {
      toast.error('Impossible de charger les offres d’emploi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffres();
  }, [typeContrat, categorie, salaireMin]);

  useEffect(() => {
    if (user?.role === 'CANDIDAT') {
      api
        .get('/api/favoris')
        .then((res) => {
          const favs: Favori[] = res.data || [];
          setFavoriIds(favs.map((f) => f.offre.id));
        })
        .catch(() => {});

      api
        .get('/api/candidatures/me')
        .then((res) => {
          const apps = res.data || [];
          setAppliedOfferIds(apps.map((a: any) => a.offreId));
        })
        .catch(() => {});
    } else {
      setFavoriIds([]);
      setAppliedOfferIds([]);
    }
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (keyword) next.set('keyword', keyword);
    if (localisation) next.set('localisation', localisation);
    if (typeContrat) next.set('typeContrat', typeContrat);
    if (categorie) next.set('categorie', categorie);
    setSearchParams(next);
    fetchOffres();
  };

  const handleSaveSearch = async () => {
    if (!user) {
      toast.info('Veuillez vous connecter en tant que candidat pour enregistrer cette recherche.');
      navigate('/auth?mode=login&role=CANDIDAT');
      return;
    }
    if (user.role !== 'CANDIDAT') {
      toast.warning('Seuls les comptes Candidat peuvent enregistrer une alerte de recherche.');
      return;
    }
    try {
      await api.post('/api/recherches', {
        motCle: keyword || 'Toutes les offres',
        localisation: localisation || 'France entière',
        typeContrat: typeContrat || 'Tous contrats',
        categorie: categorie || 'Toutes catégories',
      });
      toast.success('Recherche enregistrée dans votre espace Candidat !');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    }
  };

  const handleToggleFavorite = async (offreId: number) => {
    if (!user) {
      toast.info('Veuillez vous connecter avec un compte Candidat pour ajouter aux favoris.');
      navigate('/auth?mode=login&role=CANDIDAT');
      return;
    }
    if (user.role !== 'CANDIDAT') {
      toast.warning('Seuls les comptes Candidat peuvent gérer des offres favorites.');
      return;
    }
    try {
      if (favoriIds.includes(offreId)) {
        await api.delete(`/api/favoris/${offreId}`);
        setFavoriIds((prev) => prev.filter((id) => id !== offreId));
        toast.info('Offre retirée de vos favoris.');
      } else {
        await api.post(`/api/favoris/${offreId}`);
        setFavoriIds((prev) => [...prev, offreId]);
        toast.success('Offre ajoutée à vos favoris !');
      }
    } catch {
      toast.error('Impossible de modifier vos favoris.');
    }
  };

  const resetFilters = () => {
    setKeyword('');
    setLocalisation('');
    setTypeContrat('');
    setCategorie('');
    setModeTravail('');
    setSalaireMin('');
    setSearchParams({});
    setTimeout(fetchOffres, 10);
  };

  const displayedOffres = [...offres]
    .filter((o) =>
      modeTravail ? (o.modeTravail || '').toLowerCase() === modeTravail.toLowerCase() : true
    )
    .sort((a, b) => {
      if (sortBy === 'salary') {
        return (b.salaireMax || b.salaire || 0) - (a.salaireMax || a.salaire || 0);
      }
      if (sortBy === 'popular') {
        return (b.nombreCandidatures || 0) - (a.nombreCandidatures || 0);
      }
      return b.id - a.id;
    });

  const totalPages = Math.max(1, Math.ceil(displayedOffres.length / pageSize));
  const paginatedOffres = displayedOffres.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      {/* Page Title (Exact Superio `.page-title`) */}
      <section className="page-title">
        <div className="auto-container">
          <div className="title-outer">
            <h1>Trouver un Emploi</h1>
            <ul className="page-breadcrumb">
              <li>
                <Link to="/">Accueil</Link>
              </li>
              <li>Offres d’emploi</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Listing Section (Exact Superio `.ls-section`) */}
      <section className="ls-section">
        <div className="auto-container">
          <div className="row">
            {/* Filters Column */}
            <div className="filters-column col-lg-4 col-md-12 col-sm-12">
              <div className="inner-column">
                <form onSubmit={handleSearchSubmit} className="filters-outer">
                  {/* Search by Keywords */}
                  <div className="filter-block">
                    <h4>Recherche par mot-clé</h4>
                    <div className="form-group">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Titre du poste, compétence, société..."
                      />
                      <span className="icon la la-search"></span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="filter-block">
                    <h4>Localisation</h4>
                    <div className="form-group">
                      <input
                        type="text"
                        value={localisation}
                        onChange={(e) => setLocalisation(e.target.value)}
                        placeholder="Ville (Paris, Lyon, Bordeaux...)"
                      />
                      <span className="icon la la-map-marker"></span>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="filter-block">
                    <h4>Catégorie</h4>
                    <div className="form-group">
                      <select
                        className="chosen-select"
                        value={categorie}
                        onChange={(e) => setCategorie(e.target.value)}
                        style={{
                          width: '100%',
                          height: '50px',
                          padding: '0 20px',
                          borderRadius: '8px',
                          border: '1px solid #ecedf2',
                          background: '#fff',
                        }}
                      >
                        <option value="">Toutes les catégories</option>
                        <option value="Ingénierie & Tech">Ingénierie & Tech</option>
                        <option value="Data & IA">Data & IA</option>
                        <option value="Design & Produit">Design & Produit</option>
                      </select>
                    </div>
                  </div>

                  {/* Contract Type */}
                  <div className="filter-block">
                    <h4>Type de contrat</h4>
                    <div className="form-group">
                      <select
                        className="chosen-select"
                        value={typeContrat}
                        onChange={(e) => setTypeContrat(e.target.value)}
                        style={{
                          width: '100%',
                          height: '50px',
                          padding: '0 20px',
                          borderRadius: '8px',
                          border: '1px solid #ecedf2',
                          background: '#fff',
                        }}
                      >
                        <option value="">Tous les contrats</option>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Stage">Stage</option>
                        <option value="Alternance">Alternance</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>

                  {/* Work Mode */}
                  <div className="filter-block">
                    <h4>Mode de travail</h4>
                    <div className="form-group">
                      <select
                        className="chosen-select"
                        value={modeTravail}
                        onChange={(e) => setModeTravail(e.target.value)}
                        style={{
                          width: '100%',
                          height: '50px',
                          padding: '0 20px',
                          borderRadius: '8px',
                          border: '1px solid #ecedf2',
                          background: '#fff',
                        }}
                      >
                        <option value="">Tous les modes</option>
                        <option value="Hybride">Hybride</option>
                        <option value="Télétravail">Télétravail complet</option>
                        <option value="Présentiel">Présentiel</option>
                      </select>
                    </div>
                  </div>

                  {/* Minimum Salary */}
                  <div className="filter-block">
                    <h4>Salaire minimum annuel</h4>
                    <div className="form-group">
                      <select
                        className="chosen-select"
                        value={salaireMin}
                        onChange={(e) => setSalaireMin(e.target.value)}
                        style={{
                          width: '100%',
                          height: '50px',
                          padding: '0 20px',
                          borderRadius: '8px',
                          border: '1px solid #ecedf2',
                          background: '#fff',
                        }}
                      >
                        <option value="">Tous les salaires</option>
                        <option value="35000">À partir de 35 000 € / an</option>
                        <option value="50000">À partir de 50 000 € / an</option>
                        <option value="60000">À partir de 60 000 € / an</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button type="submit" className="theme-btn btn-style-one" style={{ width: '100%' }}>
                      Appliquer les filtres
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSearch}
                      className="theme-btn btn-style-three"
                      style={{ width: '100%' }}
                    >
                      <i className="la la-bell" style={{ marginRight: '6px' }}></i>
                      Enregistrer cette recherche
                    </button>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="theme-btn btn-style-two"
                      style={{ width: '100%' }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Content Column */}
            <div className="content-column col-lg-8 col-md-12 col-sm-12">
              <div className="ls-outer">
                <div className="ls-switcher">
                  <div className="showing-result">
                    <div className="text">
                      Affichage de <strong>{displayedOffres.length}</strong> offre(s) d’emploi disponible(s)
                    </div>
                  </div>
                  <div className="sort-by">
                    <select
                      className="chosen-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      style={{
                        height: '45px',
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid #ecedf2',
                        background: '#f0f5f7',
                        fontSize: '14px',
                      }}
                    >
                      <option value="recent">Trier par : Plus récentes</option>
                      <option value="salary">Trier par : Salaire le plus élevé</option>
                      <option value="popular">Trier par : Plus de candidatures</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    Chargement des offres d’emploi...
                  </div>
                ) : displayedOffres.length === 0 ? (
                  <div
                    className="ls-widget"
                    style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px' }}
                  >
                    <h4>Aucune offre ne correspond à votre recherche</h4>
                    <p style={{ marginTop: '10px', marginBottom: '20px' }}>
                      Essayez de modifier vos filtres ou réinitialisez la recherche.
                    </p>
                    <button onClick={resetFilters} className="theme-btn btn-style-one">
                      Voir toutes les offres
                    </button>
                  </div>
                ) : (
                  <>
                    {paginatedOffres.map((offre) => (
                      <JobOfferCard
                        key={offre.id}
                        offre={offre}
                        isFavorite={favoriIds.includes(offre.id)}
                        onToggleFavorite={handleToggleFavorite}
                        hasApplied={appliedOfferIds.includes(offre.id)}
                      />
                    ))}

                    {totalPages > 1 && (
                      <nav className="ls-pagination" style={{ marginTop: '30px' }}>
                        <ul style={{ display: 'flex', justifyContent: 'center', gap: '8px', listStyle: 'none', padding: 0 }}>
                          <li>
                            <button
                              type="button"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              className="theme-btn btn-style-three"
                              style={{ padding: '8px 16px', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                              ← Précédent
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <li key={page}>
                              <button
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`theme-btn ${
                                  currentPage === page ? 'btn-style-one' : 'btn-style-three'
                                }`}
                                style={{ padding: '8px 15px', border: 'none', cursor: 'pointer' }}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          <li>
                            <button
                              type="button"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                              className="theme-btn btn-style-three"
                              style={{ padding: '8px 16px', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                            >
                              Suivant →
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, candidat, refreshProfile } = useAuth();

  const [offre, setOffre] = useState<Offre | null>(null);
  const [relatedOffres, setRelatedOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [lettreMotivation, setLettreMotivation] = useState('');
  const [customCvUrl, setCustomCvUrl] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/api/offres/${id}`)
      .then((res) => {
        setOffre(res.data);
        setLettreMotivation(
          `Madame, Monsieur,\n\nVivant un fort intérêt pour les projets de ${res.data.nomEntreprise}, je vous soumets ma candidature au poste de ${res.data.titre}. Mon parcours et mes compétences techniques correspondent pleinement aux exigences de cette mission.\n\nDans l'attente d'un prochain échange, je vous prie d'agréer l'expression de mes salutations distinguées.`
        );
      })
      .catch(() => toast.error('Offre introuvable.'))
      .finally(() => setLoading(false));

    api
      .get('/api/offres', { params: { size: 4 } })
      .then((res) => {
        const list: Offre[] = res.data.content || [];
        setRelatedOffres(list.filter((o) => o.id !== Number(id)).slice(0, 2));
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (user?.role === 'CANDIDAT' && id) {
      api
        .get('/api/candidatures/me')
        .then((res) => {
          const apps = res.data || [];
          setAlreadyApplied(apps.some((a: { offreId: number }) => a.offreId === Number(id)));
        })
        .catch(() => {});

      api
        .get('/api/favoris')
        .then((res) => {
          const favs: Favori[] = res.data || [];
          setIsFavorite(favs.some((f) => f.offre.id === Number(id)));
        })
        .catch(() => {});
    } else {
      setAlreadyApplied(false);
      setIsFavorite(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (searchParams.get('apply') === 'true' && !loading && offre) {
      if (alreadyApplied) {
        toast.info('Vous avez déjà postulé à cette offre d’emploi.');
        return;
      }
      if (!user) {
        toast.info('Veuillez vous connecter en tant que candidat pour postuler.');
        navigate('/auth?mode=login&role=CANDIDAT');
        return;
      }
      if (user.role !== 'CANDIDAT') {
        toast.warning('Seuls les comptes Candidat peuvent postuler à une offre.');
        return;
      }
      setShowApplyModal(true);
    }
  }, [searchParams, alreadyApplied, loading, offre, user]);

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCv(true);
    try {
      const result = await uploadDocumentOrLogo(file, 'cv');
      setCustomCvUrl(result.url);
      await refreshProfile();
      toast.success(`CV "${result.fileName}" téléchargé avec succès dans Firebase Storage !`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du téléchargement du CV.');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offre) return;
    setSubmitting(true);
    try {
      await api.post('/api/candidatures', {
        offreId: offre.id,
        lettreMotivation,
        cvUrlSpecifique: customCvUrl || candidat?.cvUrl || null,
      });
      setAlreadyApplied(true);
      setOffre((prev) => (prev ? { ...prev, nombreCandidatures: (prev.nombreCandidatures || 0) + 1 } : prev));
      setShowApplyModal(false);
      await showProfessionalSuccessModal(
        'Candidature envoyée !',
        `Votre candidature pour le poste « ${offre.titre} » chez ${offre.nomEntreprise} a bien été transmise.`
      );
    } catch (err: any) {
      await showProfessionalErrorModal(
        'Candidature non envoyée',
        err,
        'Impossible de transmettre votre candidature pour le moment.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFav = async () => {
    if (!offre) return;
    if (!user) {
      toast.info('Veuillez vous connecter en tant que candidat pour enregistrer cette offre.');
      navigate('/auth?mode=login&role=CANDIDAT');
      return;
    }
    if (user.role !== 'CANDIDAT') {
      toast.warning('Seuls les comptes Candidat peuvent enregistrer des offres en favoris.');
      return;
    }
    try {
      if (isFavorite) {
        await api.delete(`/api/favoris/${offre.id}`);
        setIsFavorite(false);
        toast.info('Retirée des favoris.');
      } else {
        await api.post(`/api/favoris/${offre.id}`);
        setIsFavorite(true);
        toast.success('Ajoutée aux favoris !');
      }
    } catch {
      toast.error('Action impossible.');
    }
  };

  if (loading || !offre) {
    return (
      <section className="job-detail-section">
        <div className="auto-container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h4>{loading ? 'Chargement des détails de l’offre...' : 'Offre introuvable'}</h4>
        </div>
      </section>
    );
  }

  const skills = (offre.competencesRequises || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const candidateSkillsLower = (candidat?.competences || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const matchedSkills = skills.filter((reqSkill) =>
    candidateSkillsLower.some(
      (cs) => cs.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs)
    )
  );

  const matchPercentage =
    skills.length > 0 && candidateSkillsLower.length > 0
      ? Math.min(98, Math.max(45, Math.round((matchedSkills.length / skills.length) * 100)))
      : null;

  return (
    <section className="job-detail-section">
      {/* Upper Box (Exact Superio `.upper-box` & `.job-block-seven`) */}
      <div className="upper-box">
        <div className="auto-container">
          <div className="job-block-seven">
            <div className="inner-box">
              <div className="content">
                <span className="company-logo">
                  <img
                    src={getCompanyLogo(offre)}
                    alt={offre.nomEntreprise}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/resource/company-1.png';
                    }}
                    style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '12px' }}
                  />
                </span>
                <h4>{offre.titre}</h4>
                <ul className="job-info">
                  <li>
                    <span className="icon la la-briefcase"></span> {offre.nomEntreprise}
                  </li>
                  <li>
                    <span className="icon la la-map-marker"></span> {offre.localisation}
                  </li>
                  <li>
                    <span className="icon la la-clock"></span> Publiée le {offre.datePublication}
                  </li>
                  <li>
                    <span className="icon la la-euro"></span>{' '}
                    {formatSalaryRange(offre.salaire, offre.salaireMax)}
                  </li>
                </ul>
                <ul className="job-other-info">
                  <li className="time">{offre.typeContrat}</li>
                  {offre.modeTravail && <li className="privacy">{offre.modeTravail}</li>}
                  <li className="required">{offre.statut}</li>
                  {matchPercentage !== null && (
                    <li
                      style={{
                        background: 'rgba(52, 168, 83, 0.15)',
                        color: '#34a853',
                        fontWeight: 600,
                      }}
                    >
                      Compatibilité avec votre profil : {matchPercentage}%
                    </li>
                  )}
                </ul>
              </div>

              <div className="btn-box" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {alreadyApplied ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="theme-btn btn-style-three"
                      disabled
                      style={{
                        background: '#ecfdf5',
                        color: '#059669',
                        borderColor: '#a7f3d0',
                        cursor: 'not-allowed',
                        fontWeight: 700,
                      }}
                    >
                      <i className="la la-check-circle" style={{ marginRight: '6px' }}></i>
                      Candidature envoyée (1 seule candidature autorisée)
                    </button>
                    <Link to="/candidat" className="theme-btn btn-style-one" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      Suivre sur mon espace
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) {
                        toast.info('Veuillez vous connecter en tant que candidat pour postuler.');
                        navigate('/auth?mode=login&role=CANDIDAT');
                        return;
                      }
                      if (user.role !== 'CANDIDAT') {
                        toast.warning('Seuls les comptes Candidat peuvent postuler à une offre.');
                        return;
                      }
                      setShowApplyModal(true);
                    }}
                    className="theme-btn btn-style-one"
                  >
                    Postuler à cette offre
                  </button>
                )}
                <button
                  onClick={toggleFav}
                  className="bookmark-btn"
                  style={isFavorite ? { backgroundColor: '#1967d2', color: '#fff' } : {}}
                  title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <i className="la la-bookmark"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Detail Outer (Exact Superio `.job-detail-outer`) */}
      <div className="job-detail-outer">
        <div className="auto-container">
          <div className="row">
            <div className="content-column col-lg-8 col-md-12 col-sm-12">
              <div className="job-detail">
                <h4>Description du poste</h4>
                <p style={{ whiteSpace: 'pre-line' }}>{offre.description}</p>

                {offre.missions && (
                  <>
                    <h4>Responsabilités et Missions</h4>
                    <p style={{ whiteSpace: 'pre-line' }}>{offre.missions}</p>
                  </>
                )}

                {offre.profilRecherche && (
                  <>
                    <h4>Compétences et Expérience recherchées</h4>
                    <p style={{ whiteSpace: 'pre-line' }}>{offre.profilRecherche}</p>
                  </>
                )}
              </div>

              {/* Related Jobs */}
              {relatedOffres.length > 0 && (
                <div className="related-jobs" style={{ marginTop: '50px' }}>
                  <div className="title-box" style={{ marginBottom: '25px' }}>
                    <h3>Offres d’emploi similaires</h3>
                  </div>
                  {relatedOffres.map((rel) => (
                    <JobOfferCard key={rel.id} offre={rel} />
                  ))}
                </div>
              )}
            </div>

            <div className="sidebar-column col-lg-4 col-md-12 col-sm-12">
              <aside className="sidebar">
                <div className="sidebar-widget">
                  <h4 className="widget-title">Aperçu de l’offre</h4>
                  <div className="widget-content">
                    <ul className="job-overview">
                      <li>
                        <i className="icon la la-calendar"></i>
                        <h5>Date de publication :</h5>
                        <span>{offre.datePublication}</span>
                      </li>
                      <li>
                        <i className="icon la la-map-marker"></i>
                        <h5>Localisation :</h5>
                        <span>{offre.localisation}</span>
                      </li>
                      <li>
                        <i className="icon la la-briefcase"></i>
                        <h5>Type de contrat :</h5>
                        <span>{offre.typeContrat}</span>
                      </li>
                      {offre.niveauExperience && (
                        <li>
                          <i className="icon la la-graduation-cap"></i>
                          <h5>Niveau d’expérience :</h5>
                          <span>{offre.niveauExperience}</span>
                        </li>
                      )}
                      <li>
                        <i className="icon la la-euro"></i>
                        <h5>Salaire proposé :</h5>
                        <span>{formatSalaryRange(offre.salaire, offre.salaireMax)}</span>
                      </li>
                      <li>
                        <i className="icon la la-users"></i>
                        <h5>Candidatures reçues :</h5>
                        <span>{offre.nombreCandidatures} candidat(s)</span>
                      </li>
                    </ul>
                  </div>

                  {skills.length > 0 && (
                    <>
                      <h4 className="widget-title" style={{ marginTop: '25px' }}>
                        Compétences requises
                      </h4>
                      <div className="widget-content">
                        <ul className="job-skills">
                          {skills.map((s) => {
                            const isMatch = matchedSkills.includes(s);
                            return (
                              <li key={s}>
                                <a
                                  href="#skill"
                                  onClick={(e) => e.preventDefault()}
                                  style={
                                    isMatch
                                      ? { background: 'rgba(52, 168, 83, 0.15)', color: '#34a853' }
                                      : {}
                                  }
                                >
                                  {isMatch ? `✓ ${s}` : s}
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  )}
                </div>

                {/* Company Widget */}
                <div className="sidebar-widget company-widget">
                  <div className="widget-content">
                    <div className="company-title">
                      <div className="company-logo">
                        <img
                          src={getCompanyLogo(offre)}
                          alt={offre.nomEntreprise}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/resource/company-1.png';
                          }}
                          style={{ width: '54px', height: '54px', objectFit: 'contain' }}
                        />
                      </div>
                      <h5 className="company-name">{offre.nomEntreprise}</h5>
                      <Link
                        to={`/offres?keyword=${encodeURIComponent(offre.nomEntreprise)}`}
                        className="profile-link"
                      >
                        Voir toutes les offres de cette entreprise
                      </Link>
                    </div>

                    <ul className="company-info">
                      <li>
                        Secteur : <span>{offre.secteurEntreprise || 'Technologie & Services'}</span>
                      </li>
                      <li>
                        Localisation : <span>{offre.localisation}</span>
                      </li>
                    </ul>

                    <div className="btn-box">
                      <Link
                        to={`/offres?keyword=${encodeURIComponent(offre.nomEntreprise)}`}
                        className="theme-btn btn-style-three"
                        style={{ width: '100%' }}
                      >
                        Consulter les offres de {offre.nomEntreprise}
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Candidature */}
      {showApplyModal && (
        <div className="superio-modal-backdrop">
          <div className="superio-modal-card" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Postuler : {offre.titre}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    setLettreMotivation(
                      `Madame, Monsieur,\n\nFort(e) d'une solide expérience sur les technologies requises pour le poste de « ${offre.titre} » chez ${offre.nomEntreprise}, je souhaite mettre mes compétences techniques et mon sens du produit au service de votre équipe.\n\nDisponible rapidement pour un entretien technique, je vous joins mon CV PDF à jour.`
                    );
                    if (!customCvUrl && !candidat?.cvUrl) {
                      try {
                        const res = await api.post('/api/files/demo-cv');
                        setCustomCvUrl(res.data?.url || '/api/files/cv/cv-marie-dubois.pdf');
                      } catch {
                        setCustomCvUrl('/api/files/cv/cv-marie-dubois.pdf');
                      }
                    }
                    toast.success('Lettre de motivation et CV PDF prêts en 1 clic !');
                  }}
                  className="theme-btn btn-style-three"
                  style={{ padding: '6px 12px', fontSize: '12px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  ⚡ Pré-remplir Candidature (1 clic)
                </button>
                <button
                  onClick={() => setShowApplyModal(false)}
                  style={{ fontSize: '20px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleApplySubmit} className="default-form">
              <div className="form-group">
                <label>Votre CV au format PDF (Stocké sur Firebase Storage)</label>
                <div
                  style={{
                    background: '#f5f7fc',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    fontSize: '13px',
                  }}
                >
                  {customCvUrl || candidat?.cvUrl ? (
                    <span>
                      <i className="la la-check-circle" style={{ color: '#34a853', marginRight: '6px' }}></i>
                      CV sélectionné :{' '}
                      <a href={customCvUrl || candidat?.cvUrl} target="_blank" rel="noreferrer" style={{ color: '#1967d2', fontWeight: 600 }}>
                        Consulter mon CV PDF
                      </a>
                    </span>
                  ) : (
                    <span>Aucun CV enregistré. Veuillez importer un fichier PDF ci-dessous :</span>
                  )}
                </div>
                <input type="file" accept=".pdf,application/pdf" onChange={handleCvUpload} />
                {uploadingCv && <small style={{ color: '#1967d2' }}>Téléchargement du CV vers Firebase Storage...</small>}
              </div>

              <div className="form-group">
                <label>Lettre de motivation / Message au recruteur *</label>
                <textarea
                  rows={5}
                  required
                  value={lettreMotivation}
                  onChange={(e) => setLettreMotivation(e.target.value)}
                  placeholder="Présentez votre parcours et votre motivation pour ce poste..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="theme-btn btn-style-three"
                >
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="theme-btn btn-style-one">
                  {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export const CompaniesDirectoryPage: React.FC = () => {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/entreprises')
      .then((res) => setEntreprises(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const logos = [
    '/images/resource/company-1.png',
    '/images/resource/company-2.png',
    '/images/resource/company-3.png',
    '/images/resource/company-5.png',
  ];

  const filtered = entreprises.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      e.nomEntreprise.toLowerCase().includes(q) ||
      (e.secteur || '').toLowerCase().includes(q) ||
      (e.adresse || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <section className="page-title">
        <div className="auto-container">
          <div className="title-outer">
            <h1>Entreprises Partenaires</h1>
            <ul className="page-breadcrumb">
              <li>
                <Link to="/">Accueil</Link>
              </li>
              <li>Entreprises</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ls-section">
        <div className="auto-container">
          <div className="ls-widget" style={{ padding: '24px', marginBottom: '30px' }}>
            <div className="row align-items-center">
              <div className="col-lg-8 col-md-12">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une entreprise par nom, secteur d'activité ou ville..."
                  style={{
                    width: '100%',
                    height: '50px',
                    padding: '0 20px',
                    background: '#f0f5f7',
                    borderRadius: '8px',
                    border: '1px solid #ecedf2',
                  }}
                />
              </div>
              <div className="col-lg-4 col-md-12" style={{ textAlign: 'right', marginTop: '10px' }}>
                <span>
                  <strong>{filtered.length}</strong> entreprise(s) partenaire(s)
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Chargement des entreprises...</div>
          ) : (
            <div className="row">
              {filtered.map((ent, idx) => (
                <div key={ent.id} className="company-block-three col-lg-6 col-md-12 col-sm-12">
                  <div
                    className="inner-box"
                    style={{
                      background: '#fff',
                      border: '1px solid #ecedf2',
                      borderRadius: '12px',
                      padding: '30px',
                      marginBottom: '25px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
                      <img
                        src={ent.logoUrl || logos[idx % logos.length]}
                        alt={ent.nomEntreprise}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/resource/company-1.png';
                        }}
                        style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '10px' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
                          <Link to={`/offres?keyword=${encodeURIComponent(ent.nomEntreprise)}`}>
                            {ent.nomEntreprise}
                          </Link>
                        </h4>
                        <span style={{ fontSize: '14px', color: '#1967d2', fontWeight: 500 }}>
                          {ent.secteur} {ent.tailleEntreprise ? `· ${ent.tailleEntreprise}` : ''}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '14px', color: '#696969', marginBottom: '18px' }}>
                      {ent.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#696969' }}>
                        <i className="la la-map-marker"></i> {ent.adresse || 'France'}
                      </span>
                      <Link
                        to={`/offres?keyword=${encodeURIComponent(ent.nomEntreprise)}`}
                        className="theme-btn btn-style-three"
                      >
                        Voir {ent.nombreOffresActives} offre(s) active(s)
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};
