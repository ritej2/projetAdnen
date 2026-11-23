import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { professionalToast as toast } from '../services/alertService';
import api from '../services/api';
import { Entreprise, Favori, Offre } from '../types';
import { JobOfferCard } from '../components/SharedComponents';
import { Hero3DCanvas, Tilt3DCard } from '../components/ThreeScene';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Offre[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [favoriIds, setFavoriIds] = useState<number[]>([]);
  const [appliedOfferIds, setAppliedOfferIds] = useState<number[]>([]);
  const [stats, setStats] = useState({
    activeOffers: 6,
    totalCompanies: 3,
    totalCandidates: 3,
    totalApplications: 4,
  });

  useEffect(() => {
    const loadDynamicData = () => {
      api
        .get('/api/offres', { params: { size: 12 } })
        .then((res) => {
          setFeaturedJobs(res.data.content || []);
          if (res.data.totalElements !== undefined) {
            setStats((prev) => ({ ...prev, activeOffers: res.data.totalElements }));
          }
        })
        .catch(() => {});

      api
        .get('/api/entreprises')
        .then((res) => {
          const list = res.data || [];
          setEntreprises(list);
          if (list.length > 0) {
            setStats((prev) => ({ ...prev, totalCompanies: list.length }));
          }
        })
        .catch(() => {});

      api
        .get('/api/stats/public')
        .then((res) => {
          if (res.data) setStats(res.data);
        })
        .catch(() => {});
    };

    loadDynamicData();
    const interval = setInterval(loadDynamicData, 4000);
    window.addEventListener('focus', loadDynamicData);
    window.addEventListener('storage', loadDynamicData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', loadDynamicData);
      window.removeEventListener('storage', loadDynamicData);
    };
  }, []);

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

  const handleToggleFavorite = async (offreId: number) => {
    if (!user) {
      toast.info('Veuillez vous connecter en tant que candidat pour ajouter cette offre aux favoris.');
      navigate('/auth?mode=login&role=CANDIDAT');
      return;
    }
    if (user.role !== 'CANDIDAT') {
      toast.warning('Seuls les comptes Candidat peuvent enregistrer des offres en favoris.');
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

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (location.trim()) params.set('localisation', location.trim());
    navigate(`/offres?${params.toString()}`);
  };

  const countByCategory = (catName: string) =>
    featuredJobs.filter((j) => (j.categorie || '').toLowerCase() === catName.toLowerCase()).length;

  const categories = [
    {
      name: 'Ingénierie & Tech',
      subtitle: 'Java 21, Spring Boot, React, Cloud & DevOps',
      icon: 'la la-code',
      count: countByCategory('Ingénierie & Tech') || 3,
    },
    {
      name: 'Data & IA',
      subtitle: 'Machine Learning, Data Science, Big Data & SQL',
      icon: 'la la-database',
      count: countByCategory('Data & IA') || 2,
    },
    {
      name: 'Design & Produit',
      subtitle: 'UI/UX Design, Product Management, Design System',
      icon: 'la la-pencil-ruler',
      count: countByCategory('Design & Produit') || 1,
    },
    {
      name: 'Cybersécurité & Réseaux',
      subtitle: 'Sécurité Cloud, Pentest, Architecture Réseau',
      icon: 'la la-shield-alt',
      count: 2,
    },
    {
      name: 'Finance & Fintech',
      subtitle: 'Analyse Financière, Paiements, Audit & Risques',
      icon: 'la la-coins',
      count: 2,
    },
    {
      name: 'Gestion de Projet & Agilité',
      subtitle: 'Scrum Master, Product Owner, Direction IT',
      icon: 'la la-rocket',
      count: 2,
    },
  ];

  const companyLogos = [
    '/images/resource/company-1.png',
    '/images/resource/company-2.png',
    '/images/resource/company-3.png',
    '/images/resource/company-5.png',
  ];

  return (
    <>
      {/* Banner Section (Exact Superio `.banner-section` + Interactive 3D Neural Sphere) */}
      <section className="banner-section">
        <Hero3DCanvas />
        <div className="auto-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="row">
            <div className="content-column col-lg-7 col-md-12 col-sm-12">
              <div className="inner-column">
                <div className="title-box">
                  <div className="jf-live-pill">
                    <span className="jf-live-dot"></span>
                    {lang === 'ar'
                      ? 'منصة التوظيف والمسار المهني · تجربة تفاعلية 3D'
                      : 'Plateforme Recrutement & Carrières · Expérience 3D'}
                  </div>
                  <h3 style={{ lineHeight: 1.25 }}>
                    {lang === 'ar'
                      ? 'ابحث عن وظيفتك المثالية وطوّر مسارك المهني'
                      : 'Trouvez l’Emploi Idéal & Propulsez Votre Carrière'}
                    <div style={{ fontSize: '17px', fontWeight: 600, color: '#4f46e5', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }}></span>
                      <span>
                        <strong style={{ color: '#2563eb', fontSize: '20px' }}>{stats.activeOffers}</strong>{' '}
                        {lang === 'ar' ? 'فرصة عمل نشطة ومحققة متاحة لك الآن' : 'offres d’emploi vérifiées prêtes pour vous'}
                      </span>
                    </div>
                  </h3>
                  <div className="text">
                    {lang === 'ar'
                      ? 'اكتشف أفضل فرص العمل من الشركات الرائدة، قدّم سيرتك الذاتية وتابع مسار التوظيف بدقة وسرعة.'
                      : 'Découvrez les opportunités des meilleures entreprises, déposez votre candidature et suivez vos recrutements en direct.'}
                  </div>
                </div>

                {/* Job Search Form */}
                <div className="job-search-form">
                  <form onSubmit={handleHeroSearch}>
                    <div className="row">
                      <div className="form-group col-lg-5 col-md-12 col-sm-12">
                        <span className="icon la la-search"></span>
                        <input
                          type="text"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          placeholder={lang === 'ar' ? 'المسمى الوظيفي، المهارة، اسم الشركة...' : 'Titre du poste, compétence, entreprise...'}
                        />
                      </div>
                      <div className="form-group col-lg-4 col-md-12 col-sm-12 location">
                        <span className="icon la la-map-marker"></span>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={lang === 'ar' ? 'المدينة أو المنطقة (مثال: باريس)' : 'Ville ou région (ex: Paris)'}
                        />
                      </div>
                      <div className="form-group col-lg-3 col-md-12 col-sm-12 btn-box">
                        <button type="submit" className="theme-btn btn-style-one">
                          <span className="btn-title">{lang === 'ar' ? 'بحث' : 'Rechercher'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Popular Search */}
                <div className="popular-searches">
                  <span className="title">{lang === 'ar' ? 'عمليات البحث الشائعة :' : 'Recherches populaires :'} </span>
                  <Link to="/offres?keyword=Java">Java / Spring Boot</Link>,{' '}
                  <Link to="/offres?keyword=React">React / TypeScript</Link>,{' '}
                  <Link to="/offres?keyword=Designer">Product Designer</Link>,{' '}
                  <Link to="/offres?keyword=Data">{lang === 'ar' ? 'البيانات والذكاء الاصطناعي' : 'Data & IA'}</Link>,{' '}
                  <Link to="/offres?typeContrat=CDI">CDI</Link>,{' '}
                  <Link to="/offres?typeContrat=Stage">{lang === 'ar' ? 'تدريب' : 'Stage'}</Link>
                </div>
              </div>
            </div>

            <div className="image-column col-lg-5 col-md-12">
              <Tilt3DCard className="image-box" intensity={10}>
                <figure className="main-image">
                  <img src="/images/resource/banner-img-2.png" alt="Recrutement Superio" />
                </figure>

                {/* Info Block One */}
                <div className="info_block" style={{ top: '40px', left: '-20px' }}>
                  <span className="icon la la-envelope"></span>
                  <p>
                    {lang === 'ar' ? 'مقابلة مؤكدة' : 'Entretien confirmé'} <br />
                    {lang === 'ar' ? 'ماري ديبوا' : 'Marie Dubois'}
                  </p>
                </div>

                {/* Info Block Three */}
                <div className="info_block_three" style={{ bottom: '120px', right: '-10px' }}>
                  <span className="icon la la-briefcase"></span>
                  <p>Nova Studio</p>
                  <span className="sub-text">{lang === 'ar' ? 'شركة موثقة ومحققة' : 'Entreprise Vérifiée'}</span>
                  <span className="right_icon fa fa-check"></span>
                </div>

                {/* Info Block Four */}
                <div className="info_block_four" style={{ bottom: '20px', left: '0px' }}>
                  <span className="icon la la-file-pdf"></span>
                  <div className="inner">
                    <p>Déposez votre CV</p>
                    <span className="sub-text">Analyse IA & Matching Instantané</span>
                  </div>
                </div>
              </Tilt3DCard>
            </div>
          </div>
        </div>
      </section>

      {/* Job Categories (Exact Superio `.job-categories`) */}
      <section className="job-categories">
        <div className="auto-container">
          <div className="sec-title text-center">
            <h2>Catégories d’Emploi Populaires</h2>
            <div className="text">
              {stats.activeOffers} offres actives réparties dans {stats.totalCompanies} entreprises partenaires.
            </div>
          </div>

          <div className="row">
            {categories.map((cat) => (
              <div key={cat.name} className="category-block col-lg-4 col-md-6 col-sm-12">
                <div
                  className="inner-box"
                  onClick={() => navigate(`/offres?categorie=${encodeURIComponent(cat.name)}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="content">
                    <span className={`icon ${cat.icon}`}></span>
                    <h4>
                      <Link to={`/offres?categorie=${encodeURIComponent(cat.name)}`}>
                        {cat.name}
                      </Link>
                    </h4>
                    <p>
                      ({cat.count} poste(s) — {cat.subtitle})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Job Section (Exact Superio `.job-section`) */}
      <section className="job-section">
        <div className="auto-container">
          <div className="sec-title text-center">
            <h2>Offres d’Emploi à la Une</h2>
            <div className="text">
              Connaissez votre valeur et trouvez l’emploi qui correspond à vos compétences
            </div>
          </div>

          <div className="row">
            {featuredJobs.slice(0, 6).map((job) => (
              <div key={job.id} className="col-lg-6 col-md-12 col-sm-12">
                <JobOfferCard
                  offre={job}
                  isFavorite={favoriIds.includes(job.id)}
                  onToggleFavorite={handleToggleFavorite}
                  hasApplied={appliedOfferIds.includes(job.id)}
                />
              </div>
            ))}
          </div>

          <div className="btn-box">
            <Link to="/offres" className="theme-btn btn-style-one bg-blue">
              <span className="btn-title">
                {lang === 'ar'
                  ? `تصفح جميع عروض العمل (${stats.activeOffers})`
                  : `Parcourir toutes les offres (${stats.activeOffers})`}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section (Superio `.work-section` style) */}
      <section className="work-section style-two" style={{ background: '#f5f7fc', padding: '80px 0' }}>
        <div className="auto-container">
          <div className="sec-title text-center">
            <h2>Comment fonctionne notre plateforme ?</h2>
            <div className="text">
              Un parcours simple, rapide et transparent pour les candidats comme pour les recruteurs
            </div>
          </div>

          <div className="row">
            <div className="work-block col-lg-4 col-md-6 col-sm-12">
              <div
                className="inner-box"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '40px 30px',
                  textAlign: 'center',
                  boxShadow: '0 6px 15px rgba(64, 79, 104, 0.05)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(25, 103, 210, 0.1)',
                    color: '#1967d2',
                    fontSize: '32px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <i className="la la-user-plus"></i>
                </div>
                <h5 style={{ fontWeight: 600, marginBottom: '12px' }}>
                  1. Créez votre profil & déposez votre CV
                </h5>
                <p style={{ fontSize: '14px', color: '#696969', margin: 0 }}>
                  Inscrivez-vous avec Firebase Authentication, renseignez vos compétences et téléchargez votre CV au format PDF dans Firebase Storage.
                </p>
              </div>
            </div>

            <div className="work-block col-lg-4 col-md-6 col-sm-12">
              <div
                className="inner-box"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '40px 30px',
                  textAlign: 'center',
                  boxShadow: '0 6px 15px rgba(64, 79, 104, 0.05)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(52, 168, 83, 0.12)',
                    color: '#34a853',
                    fontSize: '32px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <i className="la la-paper-plane"></i>
                </div>
                <h5 style={{ fontWeight: 600, marginBottom: '12px' }}>
                  2. Recherchez & postulez en 1 clic
                </h5>
                <p style={{ fontSize: '14px', color: '#696969', margin: 0 }}>
                  Filtrez les offres par titre, ville ou type de contrat (CDI, CDD, Stage, Alternance), sauvegardez vos favoris et envoyez votre candidature.
                </p>
              </div>
            </div>

            <div className="work-block col-lg-4 col-md-6 col-sm-12">
              <div
                className="inner-box"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '40px 30px',
                  textAlign: 'center',
                  boxShadow: '0 6px 15px rgba(64, 79, 104, 0.05)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(249, 171, 0, 0.15)',
                    color: '#d97706',
                    fontSize: '32px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <i className="la la-calendar-check"></i>
                </div>
                <h5 style={{ fontWeight: 600, marginBottom: '12px' }}>
                  3. Suivez vos candidatures & entretiens
                </h5>
                <p style={{ fontSize: '14px', color: '#696969', margin: 0 }}>
                  Consultez la réponse des recruteurs en temps réel et accédez aux dates, horaires et liens de visioconférence de vos entretiens.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section & Fun Facts (Exact Superio `.about-section`) */}
      <section className="about-section">
        <div className="auto-container">
          <div className="row">
            <div className="content-column col-lg-6 col-md-12 col-sm-12 order-2">
              <div className="inner-column">
                <div className="sec-title">
                  <h2>Des centaines d’opportunités. Trouvez celle qui vous correspond.</h2>
                  <div className="text">
                    Recherchez parmi toutes les offres ouvertes, téléchargez votre CV au format PDF, postulez en un clic et suivez l’état de vos candidatures et entretiens depuis votre tableau de bord.
                  </div>
                </div>
                <ul className="list-style-one">
                  <li>Création de profil candidat et dépôt de CV sécurisé dans Firebase Storage</li>
                  <li>Suivi en temps réel des candidatures et des entretiens programmés</li>
                  <li>Espace recruteur complet pour publier et gérer les offres d’emploi</li>
                </ul>
                <Link
                  to={
                    user
                      ? user.role === 'ENTREPRISE'
                        ? '/entreprise'
                        : user.role === 'ADMIN'
                        ? '/admin'
                        : '/candidat'
                      : '/auth?mode=register'
                  }
                  className="theme-btn btn-style-one bg-blue"
                >
                  <span className="btn-title">
                    {user ? 'Accéder à mon tableau de bord' : 'Commencer maintenant'}
                  </span>
                </Link>
              </div>
            </div>

            <div className="image-column col-lg-6 col-md-12 col-sm-12">
              <figure className="image">
                <img src="/images/resource/featured-4.png" alt="Plateforme Superio" />
              </figure>
            </div>
          </div>

          {/* Fun Fact Section */}
          <div className="fun-fact-section">
            <div className="row">
              <div className="counter-column col-lg-4 col-md-4 col-sm-12">
                <div className="count-box">
                  <span className="count-text">{stats.activeOffers}</span>+
                </div>
                <h4 className="counter-title">
                  {lang === 'ar' ? 'وظائف معلنة ومحققة ونشطة' : 'Offres d’emploi vérifiées et actives'}
                </h4>
              </div>

              <div className="counter-column col-lg-4 col-md-4 col-sm-12">
                <div className="count-box">
                  <span className="count-text">{stats.totalCompanies}</span>+
                </div>
                <h4 className="counter-title">
                  {lang === 'ar' ? 'شركات توظف بكثافة حالياً' : 'Entreprises qui recrutent activement'}
                </h4>
              </div>

              <div className="counter-column col-lg-4 col-md-4 col-sm-12">
                <div className="count-box">
                  <span className="count-text">{stats.totalApplications}</span>+
                </div>
                <h4 className="counter-title">
                  {lang === 'ar' ? 'طلبات توظيف تمت معالجتها' : 'Candidatures traitées sur la plateforme'}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Companies Section */}
      {entreprises.length > 0 && (
        <section className="top-companies" style={{ background: '#f5f7fc', padding: '70px 0' }}>
          <div className="auto-container">
            <div className="sec-title">
              <h2>Entreprises Partenaires qui Recrutent</h2>
              <div className="text">
                Découvrez les entreprises inscrites sur la plateforme et consultez leurs postes ouverts
              </div>
            </div>

            <div className="row">
              {entreprises.map((ent, idx) => (
                <div key={ent.id} className="company-block col-lg-4 col-md-6 col-sm-12" style={{ marginBottom: '24px' }}>
                  <div
                    className="inner-box"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #ecedf2',
                      borderRadius: '12px',
                      padding: '30px',
                      textAlign: 'center',
                      height: '100%',
                    }}
                  >
                    <figure className="image" style={{ marginBottom: '15px' }}>
                      <img
                        src={ent.logoUrl || companyLogos[idx % companyLogos.length]}
                        alt={ent.nomEntreprise}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/resource/company-1.png';
                        }}
                        style={{ width: '70px', height: '70px', objectFit: 'contain', margin: '0 auto' }}
                      />
                    </figure>
                    <h4 className="name" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
                      <Link to={`/offres?keyword=${encodeURIComponent(ent.nomEntreprise)}`}>
                        {ent.nomEntreprise}
                      </Link>
                    </h4>
                    <div className="location" style={{ fontSize: '13px', color: '#696969', marginBottom: '12px' }}>
                      <i className="la la-map-marker"></i> {ent.adresse || 'Paris, France'} · {ent.secteur}
                    </div>
                    <Link
                      to={`/offres?keyword=${encodeURIComponent(ent.nomEntreprise)}`}
                      className="theme-btn btn-style-three"
                      style={{ width: '100%' }}
                    >
                      {ent.nombreOffresActives} offre(s) active(s)
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call To Action (Exact Superio `.call-to-action`) */}
      <section className="call-to-action">
        <div className="auto-container">
          <div className="outer-box">
            <div className="content-column">
              <div className="sec-title">
                <h2>Vous recrutez ?</h2>
                <div className="text">
                  Publiez vos offres d’emploi, consultez les CV des candidats autorisés et planifiez vos entretiens directement depuis votre espace entreprise.
                </div>
                <a
                  href="/entreprise"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!user) {
                      toast.info('Connectez-vous avec un compte Entreprise pour publier une offre.');
                      navigate('/auth?mode=login&role=ENTREPRISE');
                    } else if (user.role === 'ENTREPRISE') {
                      navigate('/entreprise');
                    } else {
                      toast.warning('La publication d’offres est réservée aux comptes Entreprise.');
                    }
                  }}
                  className="theme-btn btn-style-one bg-blue"
                >
                  <span className="btn-title">Publier une offre maintenant</span>
                </a>
              </div>
            </div>

            <div
              className="image-column"
              style={{ backgroundImage: 'url(/images/resource/jobseeker.png)' }}
            >
              <figure className="image">
                <img src="/images/resource/jobseeker.png" alt="Recruter" />
              </figure>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
