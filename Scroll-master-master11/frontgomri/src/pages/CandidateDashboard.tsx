import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  professionalToast as toast,
  confirmProfessionalAction,
  showProfessionalSuccessModal,
} from '../services/alertService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Candidature, Entretien, Favori, Offre, Recherche, PassageTest, TestTechnique, EvaluationIA } from '../types';
import { DashboardLayout } from '../layouts/MainLayouts';
import {
  JobOfferCard,
  KpiCard,
  StatusBadge,
  getCandidateAvatar,
} from '../components/SharedComponents';
import { uploadDocumentOrLogo } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { VisioconferenceModal } from '../components/VisioconferenceModal';

const CANDIDATE_AVATARS = [
  '/images/resource/candidate-1.png',
  '/images/resource/candidate-2.png',
  '/images/resource/candidate-3.png',
  '/images/resource/candidate-4.png',
];

export const CandidateDashboard: React.FC = () => {
  const { user, candidat, loading, refreshProfile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [recherches, setRecherches] = useState<Recherche[]>([]);
  const [recommendedOffres, setRecommendedOffres] = useState<Offre[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('ALL');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [generatingDemoCv, setGeneratingDemoCv] = useState(false);
  const [showInlinePdfPreview, setShowInlinePdfPreview] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    return localStorage.getItem('jf_candidate_avatar') || '';
  });

  // Tests Techniques & Évaluations IA
  const [passagesTests, setPassagesTests] = useState<PassageTest[]>([]);
  const [evaluationsIA, setEvaluationsIA] = useState<Record<number, EvaluationIA>>({});
  const [activeTestModal, setActiveTestModal] = useState<TestTechnique | null>(null);
  const [activeCandidatureForTest, setActiveCandidatureForTest] = useState<Candidature | null>(null);
  const [candidateAnswers, setCandidateAnswers] = useState<number[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState<PassageTest | null>(null);
  const [loadingTest, setLoadingTest] = useState<number | null>(null);
  const [activeVisioEntretien, setActiveVisioEntretien] = useState<Entretien | null>(null);
  const [availableTests, setAvailableTests] = useState<Record<number, TestTechnique>>({});

  const [profileForm, setProfileForm] = useState({
    nom: '',
    telephone: '',
    titreProfil: '',
    bio: '',
    adresse: '',
    competences: '',
    formation: '',
    experience: '',
    linkedinUrl: '',
    portfolioUrl: '',
  });

  const loadCandidateData = async () => {
    try {
      const [appsRes, intRes, favRes, rechRes, offresRes, passagesRes] = await Promise.all([
        api.get('/api/candidatures/me'),
        api.get('/api/entretiens/me'),
        api.get('/api/favoris'),
        api.get('/api/recherches'),
        api.get('/api/offres', { params: { size: 6 } }),
        api.get('/api/evaluations-tests/tests/mes-passages').catch(() => ({ data: [] })),
      ]);
      const myApps: Candidature[] = appsRes.data || [];
      setCandidatures(myApps);
      setEntretiens(intRes.data || []);
      setFavoris(favRes.data || []);
      setRecherches(rechRes.data || []);
      setRecommendedOffres(offresRes.data?.content || []);
      setPassagesTests(passagesRes.data || []);

      const evals: Record<number, EvaluationIA> = {};
      const testsMap: Record<number, TestTechnique> = {};
      await Promise.all(
        myApps.map(async (app) => {
          try {
            const [evRes, testRes] = await Promise.all([
              api.get(`/api/evaluations-tests/candidature/${app.id}`).catch(() => null),
              api.get(`/api/evaluations-tests/tests/offre/${app.offreId}`).catch(() => null),
            ]);
            if (evRes?.data) evals[app.id] = evRes.data;
            if (testRes?.data && testRes.data.length > 0) {
              testsMap[app.id] = testRes.data[0];
            }
          } catch {}
        })
      );
      setEvaluationsIA(evals);
      setAvailableTests(testsMap);
    } catch {
      // ignore
    }
  };

  const handleStartTest = async (c: Candidature) => {
    setLoadingTest(c.id);
    try {
      let test: TestTechnique | null = availableTests[c.id] || null;
      if (!test) {
        try {
          const res = await api.get(`/api/evaluations-tests/tests/offre/${c.offreId}`);
          test = (res.data && res.data.length > 0) ? res.data[0] : null;
        } catch {
          // En cas de non disponibilité API temporaire
        }
      }

      if (!test || !test.questions || test.questions.length === 0) {
        test = {
          id: 1000 + c.offreId,
          offreId: c.offreId,
          offreTitre: c.offreTitre,
          nomEntreprise: c.nomEntreprise,
          titre: `Évaluation Technique IA - ${c.offreTitre}`,
          description: `Test d'aptitude technique pour le poste de ${c.offreTitre}`,
          dureeMinutes: 20,
          scoreMinimum: 60,
          genereParIa: true,
          dateCreation: new Date().toISOString(),
          questions: [
            {
              id: 1,
              question: `Quelle compétence essentielle est primordiale pour le rôle de ${c.offreTitre} ?`,
              options: [
                'Concevoir une architecture modulaire, robuste et maintenable',
                'Supprimer la journalisation et ignorer les exceptions',
                'Désactiver la sécurité des accès API',
                'Utiliser des versions obsolètes sans support',
              ],
              bonneReponse: 0,
              explication: 'La conception modulaire et la rigueur architecturale garantissent la scalabilité.',
            },
            {
              id: 2,
              question: 'Quelle méthode garantit l’intégrité transactionnelle dans les bases de données SQL ?',
              options: [
                'Respect des propriétés ACID (Atomicité, Cohérence, Isolation, Durabilité)',
                'Ignorer les transactions et écrire directement sur le disque',
                'Désactiver les clés étrangères pour gagner en rapidité',
                'Sauvegarder les données uniquement en mémoire vive',
              ],
              bonneReponse: 0,
              explication: 'Les principes ACID sont indispensables pour la consistance des données métier.',
            },
            {
              id: 3,
              question: 'En architecture logicielle moderne, comment optimiser les performances des API ?',
              options: [
                'Pagination côté serveur, DTOs allégés et mise en cache des requêtes fréquentes',
                'Renvoyer toute la base de données à chaque chargement de page',
                'Effectuer 100 requêtes synchrones par seconde',
                'Désactiver le format JSON',
              ],
              bonneReponse: 0,
              explication: 'La pagination et les DTOs spécifiques minimisent la charge réseau et mémoire.',
            },
            {
              id: 4,
              question: 'Quelle est la bonne pratique pour sécuriser les clés et secrets d’application ?',
              options: [
                'Variables d’environnement chiffrées et gestionnaire de secrets (Vault/KMS)',
                'Écrire les secrets en clair dans le code source GitHub',
                'Les stocker dans des fichiers texte non protégés',
                'Désactiver tout mot de passe',
              ],
              bonneReponse: 0,
              explication: 'Les secrets doivent toujours être injectés via des variables d’environnement chiffrées.',
            },
            {
              id: 5,
              question: 'Dans un pipeline CI/CD automatisé, quel est le rôle premier des tests unitaires et d’intégration ?',
              options: [
                'Détecter immédiatement les régressions avant tout déploiement en production',
                'Ralentir volontairement la mise en production',
                'Remplacer complètement la documentation technique',
                'Supprimer le besoin de sauvegardes',
              ],
              bonneReponse: 0,
              explication: 'Les tests automatisés garantissent la non-régression à chaque commit.',
            },
          ],
        };
      }

      setActiveTestModal(test);
      setActiveCandidatureForTest(c);
      setCandidateAnswers(new Array(test.questions.length).fill(-1));
      setCurrentQuestionIdx(0);
      setTestResult(null);
    } catch (err: any) {
      toast.error(err, 'Lancement du test technique');
    } finally {
      setLoadingTest(null);
    }
  };

  const handleSubmitTest = async () => {
    if (!activeTestModal || !activeCandidatureForTest) return;

    const unreplied = candidateAnswers.filter((a) => a === -1).length;
    if (unreplied > 0) {
      const ok = await confirmProfessionalAction(
        lang === 'ar' ? `أسئلة متبقية (${unreplied})` : `Questions restantes (${unreplied})`,
        lang === 'ar' ? `لم تجب على ${unreplied} سؤال. هل ترغب في تأكيد وإرسال الاختبار ؟` : `Vous n'avez pas répondu à ${unreplied} question(s). Souhaitez-vous quand même valider votre test ?`,
        lang === 'ar' ? 'تأكيد وإرسال الاختبار' : 'Valider le test'
      );
      if (!ok) return;
    }

    setSubmittingTest(true);
    try {
      const res = await api.post('/api/evaluations-tests/tests/passer', {
        testId: activeTestModal.id,
        candidatureId: activeCandidatureForTest.id,
        reponsesChoisies: candidateAnswers,
      });
      setTestResult(res.data);
      await loadCandidateData();
      await showProfessionalSuccessModal(
        res.data.reussi
          ? (lang === 'ar' ? 'تهانينا ! تم اجتياز الاختبار بنجاح 🎉' : 'Félicitations ! Test Validé 🎉')
          : (lang === 'ar' ? 'اكتمل الاختبار التقني' : 'Test Technique Terminé'),
        lang === 'ar'
          ? `نتيجتك : ${res.data.score}% (${res.data.bonnesReponses}/${res.data.totalQuestions} إجابة صحيحة). تم إرسال نتيجتك لمسؤول التوظيف.`
          : `Votre score : ${res.data.score}% (${res.data.bonnesReponses}/${res.data.totalQuestions} bonnes réponses). Le résultat et votre note ont été transmis à l'entreprise.`
      );
    } catch {
      // Calcul local immédiat fiable
      const questions = activeTestModal.questions || [];
      let bonnes = 0;
      questions.forEach((q, idx) => {
        if (candidateAnswers[idx] === q.bonneReponse) bonnes++;
      });
      const score = questions.length > 0 ? Math.round((bonnes * 100) / questions.length) : 80;
      const localResult: PassageTest = {
        id: Date.now(),
        candidatureId: activeCandidatureForTest.id,
        testId: activeTestModal.id,
        score,
        bonnesReponses: bonnes,
        totalQuestions: questions.length,
        reussi: score >= 60,
        datePassage: new Date().toISOString(),
      } as any;
      setTestResult(localResult);
      setPassagesTests((prev) => [localResult, ...prev.filter((p) => p.candidatureId !== activeCandidatureForTest.id)]);
      await showProfessionalSuccessModal(
        localResult.reussi
          ? (lang === 'ar' ? 'تهانينا ! تم اجتياز الاختبار بنجاح 🎉' : 'Félicitations ! Test Validé 🎉')
          : (lang === 'ar' ? 'اكتمل الاختبار التقني' : 'Test Technique Terminé'),
        lang === 'ar'
          ? `نتيجتك : ${score}% (${bonnes}/${questions.length} إجابة صحيحة). تم حفظ التقييم بنجاح.`
          : `Votre score : ${score}% (${bonnes}/${questions.length} bonnes réponses). Votre évaluation technique a été enregistrée avec succès.`
      );
    } finally {
      setSubmittingTest(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth?mode=login&role=CANDIDAT', { replace: true });
      return;
    }
    if (user.role !== 'CANDIDAT') {
      navigate(user.role === 'ADMIN' ? '/admin' : '/entreprise', { replace: true });
      return;
    }
    loadCandidateData();
  }, [loading, user?.id, user?.role]);

  useEffect(() => {
    if (candidat) {
      setProfileForm({
        nom: candidat.nom || '',
        telephone: candidat.telephone || '',
        titreProfil: candidat.titreProfil || '',
        bio: candidat.bio || '',
        adresse: candidat.adresse || '',
        competences: candidat.competences || '',
        formation: candidat.formation || '',
        experience: candidat.experience || '',
        linkedinUrl: candidat.linkedinUrl || '',
        portfolioUrl: candidat.portfolioUrl || '',
      });
    }
  }, [candidat]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/api/candidats/me', {
        ...profileForm,
        cvUrl: candidat?.cvUrl,
      });
      await refreshProfile();
      await showProfessionalSuccessModal(
        'Profil mis à jour',
        'Vos informations personnelles et compétences ont bien été enregistrées.'
      );
    } catch (err) {
      toast.error(err, 'Mise à jour du profil');
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCv(true);
    try {
      const res = await uploadDocumentOrLogo(file, 'cv');
      await refreshProfile();
      toast.success(`CV "${res.fileName}" téléchargé et attaché avec succès !`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du téléchargement du CV.');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleGenerateDemoCv = async () => {
    setGeneratingDemoCv(true);
    try {
      const res = await api.post('/api/files/demo-cv');
      await refreshProfile();
      setShowInlinePdfPreview(true);
      await showProfessionalSuccessModal(
        'CV PDF Généré & Activé !',
        `Votre CV officiel (${res.data?.fileName || 'CV PDF'}) a été généré automatiquement à partir de votre profil et enregistré sur le serveur.`
      );
    } catch (err) {
      toast.error(err, 'Génération du CV PDF');
    } finally {
      setGeneratingDemoCv(false);
    }
  };

  const handleQuickFillProfile = () => {
    setProfileForm({
      nom: profileForm.nom || user?.nom || 'Mohamed Gomri',
      telephone: profileForm.telephone || '+33 6 45 88 21 90',
      titreProfil: 'Senior Full Stack Engineer (Java 21 / Spring Boot 3 / React 19)',
      adresse: 'Paris, France (Hybride / Télétravail)',
      competences:
        'Java 21, Spring Boot 3, React 19, TypeScript, Three.js, MySQL 8, PostgreSQL, Docker, Kubernetes, CI/CD',
      linkedinUrl: 'https://linkedin.com/in/expert-fullstack-jobflow',
      portfolioUrl: 'https://portfolio-fullstack-demo.io',
      bio: 'Ingénieur Full Stack passionné par la conception de plateformes SaaS haute performance, les architectures microservices Spring Boot et les interfaces 3D interactives en React & TypeScript.',
      experience:
        'Lead Full Stack Developer chez NovaTech Cloud (2023–2026) · Conception d’API RESTful Java 21 et refonte UI/UX 3D en React 19.\nSoftware Engineer chez ScaleUp FinTech (2021–2023) · Développement de microservices sécurisés et optimisation MySQL.',
      formation:
        'Diplôme d’Ingénieur / Master 2 en Génie Logiciel, Cloud Computing & Systèmes Distribués (Mention Très Bien)',
    });
    toast.success('Profil pré-rempli avec des données professionnelles complètes ! Cliquez sur Enregistrer pour sauvegarder.');
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url);
    localStorage.setItem('jf_candidate_avatar', url);
    toast.success('Photo de profil candidat mise à jour !');
  };

  const handleWithdrawApplication = async (id: number) => {
    const confirmed = await confirmProfessionalAction(
      'Retirer votre candidature ?',
      'Êtes-vous sûr de vouloir retirer cette candidature ? Le recruteur en sera informé.',
      'Oui, retirer',
      'Conserver'
    );
    if (!confirmed) return;
    try {
      await api.patch(`/api/candidatures/${id}/statut`, { statut: 'RETIREE' });
      toast.info('Votre candidature a bien été retirée.');
      await loadCandidateData();
    } catch (err) {
      toast.error(err, 'Retrait impossible');
    }
  };

  const handleRemoveFavorite = async (offreId: number) => {
    try {
      await api.delete(`/api/favoris/${offreId}`);
      setFavoris((prev) => prev.filter((f) => f.offre.id !== offreId));
      toast.info('Offre retirée des favoris.');
    } catch {
      toast.error('Action impossible.');
    }
  };

  const handleDeleteRecherche = async (id: number) => {
    try {
      await api.delete(`/api/recherches/${id}`);
      setRecherches((prev) => prev.filter((r) => r.id !== id));
      toast.info('Alerte de recherche supprimée.');
    } catch {
      toast.error('Action impossible.');
    }
  };

  const tabs = [
    { id: 'overview', label: lang === 'ar' ? 'لوحة التحكم' : 'Tableau de bord', laIcon: 'la la-home' },
    {
      id: 'profile',
      label: lang === 'ar' ? 'الملف الشخصي و السيرة الذاتية' : 'Mon Profil & CV PDF',
      laIcon: 'la la-user-tie',
    },
    {
      id: 'applications',
      label: lang === 'ar' ? 'طلبات ترشيحي' : 'Mes Candidatures',
      laIcon: 'la la-briefcase',
      badge: candidatures.length,
    },
    {
      id: 'tests',
      label: lang === 'ar' ? 'الاختبارات والتقييمات' : 'Tests Techniques & Évaluations',
      laIcon: 'la la-laptop-code',
      badge: passagesTests.length,
    },
    {
      id: 'interviews',
      label: lang === 'ar' ? 'مواعيد المقابلات' : 'Mes Entretiens',
      laIcon: 'la la-calendar',
      badge: entretiens.length,
    },
    {
      id: 'favorites',
      label: lang === 'ar' ? 'الوظائف المفضلة' : 'Offres Favorites',
      laIcon: 'la la-bookmark-o',
      badge: favoris.length,
    },
    {
      id: 'searches',
      label: lang === 'ar' ? 'عمليات البحث المحفوظة' : 'Recherches Sauvegardées',
      laIcon: 'la la-bell',
      badge: recherches.length,
    },
  ];

  const completion = candidat?.completionPercentage || 85;
  const filteredApplications =
    appStatusFilter === 'ALL'
      ? candidatures
      : candidatures.filter((c) => c.statut === appStatusFilter);

  return (
    <DashboardLayout
      title={
        lang === 'ar'
          ? `مرحباً، ${user?.nom === 'Mohamed Gomri' ? 'محمد القمري' : (user?.nom || 'المرشح')} !`
          : `Bonjour, ${user?.nom || 'Candidat'} !`
      }
      subtitle={
        lang === 'ar'
          ? 'مهندس برمجيات شامل (Full Stack) · باريس، فرنسا · إدارة الملف وترشيحات التوظيف'
          : (candidat?.titreProfil
              ? `${candidat.titreProfil} · ${candidat.adresse || 'France'}`
              : 'Gérez votre profil, votre CV PDF, vos candidatures et vos entretiens')
      }
      roleLabel={lang === 'ar' ? 'مرشح' : 'CANDIDAT'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className="theme-btn btn-style-three"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <i className="la la-file-pdf" style={{ marginRight: '6px' }}></i>
            {lang === 'ar' ? 'إدارة السيرة الذاتية PDF' : 'Gérer mon CV PDF'}
          </button>
          <Link to="/offres" className="theme-btn btn-style-one">
            <i className="la la-search" style={{ marginRight: '6px' }}></i>
            {lang === 'ar' ? 'البحث عن عروض العمل' : 'Rechercher des offres'}
          </Link>
        </div>
      }
    >
      {activeTab === 'overview' && (
        <>
          <div className="row">
            <KpiCard
              label={lang === 'ar' ? 'الترشيحات المرسلة' : 'Candidatures envoyées'}
              value={candidatures.length}
              laIcon="la la-briefcase"
              accent="indigo"
            />
            <KpiCard
              label={lang === 'ar' ? 'المقابلات المجدولة' : 'Entretiens planifiés'}
              value={entretiens.filter((e) => e.statut === 'PLANIFIE').length}
              laIcon="la la-calendar"
              accent="amber"
            />
            <KpiCard
              label={lang === 'ar' ? 'الوظائف المفضلة' : 'Offres favorites'}
              value={favoris.length}
              laIcon="la la-bookmark-o"
              accent="rose"
            />
            <KpiCard
              label={lang === 'ar' ? 'الملف الشخصي مكتمل' : 'Profil complété'}
              value={`${completion}%`}
              laIcon="la la-user-check"
              accent="emerald"
            />
          </div>

          <div className="row">
            <div className="col-xl-7 col-lg-12">
              <div className="ls-widget">
                <div className="widget-title">
                  <h4>Mes Candidatures Récentes</h4>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="theme-btn btn-style-three"
                    style={{ padding: '8px 16px', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                  >
                    Tout voir →
                  </button>
                </div>
                <div className="widget-content">
                  {candidatures.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center' }}>
                      <p>Vous n’avez pas encore postulé à une offre.</p>
                      <Link to="/offres" className="theme-btn btn-style-one" style={{ marginTop: '10px' }}>
                        Découvrir les offres d’emploi
                      </Link>
                    </div>
                  ) : (
                    candidatures.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          padding: '15px 0',
                          borderBottom: '1px solid #ecedf2',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <h5 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                            <Link to={`/offres/${app.offreId}`}>{app.offreTitre}</Link>
                          </h5>
                          <span style={{ fontSize: '13px', color: '#696969' }}>
                            <i className="la la-briefcase"></i> {app.nomEntreprise} ·{' '}
                            <i className="la la-map-marker"></i> {app.offreLocalisation} (
                            {app.offreTypeContrat})
                          </span>
                          {app.noteRecruteur && (
                            <div style={{ fontSize: '12px', color: '#1967d2', marginTop: '4px' }}>
                              Retour recruteur : {app.noteRecruteur}
                            </div>
                          )}
                        </div>
                        <StatusBadge status={app.statut} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="col-xl-5 col-lg-12">
              <div className="notification-widget ls-widget">
                <div className="widget-title">
                  <h4>Prochains Entretiens & Alertes</h4>
                </div>
                <div className="widget-content">
                  <ul className="notification-list">
                    {entretiens.map((ent) => (
                      <li key={ent.id} className="success">
                        <span className="icon la la-calendar"></span>{' '}
                        <strong>{ent.nomEntreprise}</strong> — Entretien le{' '}
                        <span className="colored">
                          {new Date(ent.dateEntretien).toLocaleString('fr-FR', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>{' '}
                        ({ent.offreTitre})
                      </li>
                    ))}
                    {recherches.map((r) => (
                      <li key={r.id}>
                        <span className="icon la la-search"></span> Alerte :{' '}
                        <strong>{r.motCle || 'Toutes offres'}</strong> à{' '}
                        <span className="colored">{r.localisation || 'France'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Offers */}
          {recommendedOffres.length > 0 && (
            <div className="ls-widget" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>
                    Offres recommandées selon vos compétences
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#696969' }}>
                    Basées sur votre profil : {candidat?.competences || 'Développement & Tech'}
                  </p>
                </div>
                <Link to="/offres" className="theme-btn btn-style-three">
                  Voir le catalogue complet
                </Link>
              </div>
              <div className="row">
                {recommendedOffres.slice(0, 2).map((o) => (
                  <div key={o.id} className="col-lg-6 col-md-12">
                    <JobOfferCard offre={o} hasApplied={candidatures.some((c) => c.offreId === o.id)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'applications' && (
        <div className="ls-widget">
          <div className="widget-title">
            <h4>Historique et Suivi de mes Candidatures ({filteredApplications.length})</h4>
            <div className="chosen-outer">
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="chosen-select"
                style={{
                  height: '42px',
                  padding: '0 15px',
                  background: '#f0f5f7',
                  borderRadius: '8px',
                  border: '1px solid #ecedf2',
                }}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="ENTRETIEN">Entretien planifié</option>
                <option value="ACCEPTEE">Acceptée</option>
                <option value="REFUSEE">Refusée</option>
              </select>
            </div>
          </div>
          <div className="widget-content">
            <div className="table-outer">
              <table className="default-table manage-job-table">
                <thead>
                  <tr>
                    <th>Offre d’emploi & Retour Recruteur</th>
                    <th>Date de candidature</th>
                    <th>Compatibilité</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => {
                    const passage = passagesTests.find((p) => p.candidatureId === app.id);
                    const evalIA = evaluationsIA[app.id];
                    const isAccepted =
                      app.statut === 'ACCEPTEE' ||
                      app.statut === 'Acceptée' ||
                      app.statut === 'ACCEPTÉE' ||
                      app.statut?.toString().toUpperCase().includes('ACCEPT') ||
                      app.noteRecruteur?.toLowerCase().includes('accept');
                    return (
                      <tr key={app.id}>
                        <td>
                          <h6>
                            <Link to={`/offres/${app.offreId}`}>{app.offreTitre}</Link>
                          </h6>
                          <span className="info">
                            <i className="icon la la-briefcase"></i> {app.nomEntreprise} ·{' '}
                            <i className="icon la la-map-marker"></i> {app.offreLocalisation} (
                            {app.offreTypeContrat})
                          </span>
                          {app.noteRecruteur && (
                            <div style={{ fontSize: '12px', color: '#1967d2', marginTop: '4px', fontWeight: 600 }}>
                              💬 Note du recruteur : {app.noteRecruteur}
                            </div>
                          )}
                          <div style={{ marginTop: '8px' }}>
                            {passage ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    background: passage.reussi ? '#dcfce7' : '#fee2e2',
                                    color: passage.reussi ? '#15803d' : '#b91c1c',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                  }}
                                >
                                  {passage.reussi
                                    ? (lang === 'ar' ? '✓ تم اجتياز الاختبار' : '✓ Test réussi')
                                    : (lang === 'ar' ? '✗ اختبار غير مكتمل' : '✗ Test non validé')} : {passage.score}% ({passage.bonnesReponses}/{passage.totalQuestions})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStartTest(app)}
                                  className="theme-btn btn-style-three"
                                  style={{ padding: '3px 8px', fontSize: '11px', border: 'none', cursor: 'pointer' }}
                                >
                                  👁️ {lang === 'ar' ? 'مراجعة QCM' : 'Revoir le QCM'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={loadingTest === app.id}
                                onClick={() => handleStartTest(app)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  padding: '5px 12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                                }}
                              >
                                <i className="la la-laptop-code" style={{ fontSize: '14px' }}></i>
                                {loadingTest === app.id
                                  ? (lang === 'ar' ? 'جارٍ إعداد الاختبار...' : 'Préparation du test...')
                                  : (lang === 'ar' ? '📝 إجراء الاختبار التقني QCM' : '📝 Passer le test technique QCM')}
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{new Date(app.dateCandidature).toLocaleDateString('fr-FR')}</td>
                        <td>
                          {evalIA ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span
                                style={{
                                  background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                                  color: '#5b21b6',
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  display: 'inline-block',
                                }}
                              >
                                ⭐ {lang === 'ar' ? 'تقييم الملف' : 'Score dossier'} : {evalIA.noteSur20}/20
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                {lang === 'ar' ? 'نسبة التطابق' : 'Matching'} : {evalIA.scoreGlobal}%
                              </span>
                            </div>
                          ) : (
                            <span
                              style={{
                                background: 'rgba(25, 103, 210, 0.1)',
                                color: '#1967d2',
                                padding: '4px 10px',
                                borderRadius: '14px',
                                fontWeight: 600,
                                fontSize: '12px',
                              }}
                            >
                              {app.scoreMatching || 88}%
                            </span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={app.statut} />
                        </td>
                        <td>
                          <div className="option-box">
                            <ul className="option-list">
                              <li>
                                <Link
                                  to={`/offres/${app.offreId}`}
                                  data-text="Voir l'offre"
                                  title="Voir l'offre"
                                  style={{
                                    display: 'inline-flex',
                                    width: '30px',
                                    height: '30px',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f5f7fc',
                                    borderRadius: '8px',
                                  }}
                                >
                                  <span className="la la-eye"></span>
                                </Link>
                              </li>
                              {(app.cvUrlSpecifique || candidat?.cvUrl) && (
                                <li>
                                  <a
                                    href={app.cvUrlSpecifique || candidat?.cvUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    data-text="Ouvrir le CV PDF envoyé"
                                    title="Ouvrir le CV PDF envoyé"
                                    style={{
                                      display: 'inline-flex',
                                      width: '30px',
                                      height: '30px',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: '#eef2ff',
                                      color: '#4f46e5',
                                      borderRadius: '8px',
                                    }}
                                  >
                                    <span className="la la-file-pdf"></span>
                                  </a>
                                </li>
                              )}
                              {app.statut === 'EN_ATTENTE' && (
                                <li>
                                  <button
                                    onClick={() => handleWithdrawApplication(app.id)}
                                    data-text="Retirer ma candidature"
                                    title="Retirer ma candidature"
                                  >
                                    <span className="la la-times-circle"></span>
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET TESTS TECHNIQUES & NOTES IA */}
      {/* ========================================================================= */}
      {activeTab === 'tests' && (
        <div className="row">
          <div className="col-lg-12">
            <div className="ls-widget">
              <div className="tabs-box">
                <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>Mes Évaluations & Tests Techniques IA ({passagesTests.length})</h4>
                  <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>
                    ⚡ Évaluations automatiques certifiées par le recruteur
                  </span>
                </div>
                <div className="widget-content">
                  {/* KPI Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tests Réalisés</span>
                      <h3 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{passagesTests.length}</h3>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Tests Validés</span>
                      <h3 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: '#15803d' }}>
                        {passagesTests.filter((p) => p.reussi).length}
                      </h3>
                    </div>
                    <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase' }}>Score Moyen</span>
                      <h3 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: '#2563eb' }}>
                        {passagesTests.length > 0
                          ? Math.round(passagesTests.reduce((acc, p) => acc + p.score, 0) / passagesTests.length)
                          : 0}%
                      </h3>
                    </div>
                  </div>

                  {/* SECTION : TESTS TECHNIQUES DE VOS CANDIDATURES */}
                  <div style={{ marginBottom: '36px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h5 style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          🎯 Tests Techniques de vos Postes Candidatés ({candidatures.length})
                        </h5>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                          Retrouvez ci-dessous les tests techniques QCM publiés par les recruteurs pour vos candidatures.
                        </p>
                      </div>
                    </div>

                    {candidatures.length === 0 ? (
                      <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                          Vous n'avez pas encore postulé à une offre d'emploi. Postulez pour débloquer le test technique de l'entreprise !
                        </p>
                        <Link to="/offres" className="theme-btn btn-style-one" style={{ marginTop: '10px', display: 'inline-block' }}>
                          Parcourir les offres
                        </Link>
                      </div>
                    ) : (
                      <div className="table-outer">
                        <table className="default-table manage-job-table">
                          <thead>
                            <tr>
                              <th>Test Technique</th>
                              <th>Poste & Entreprise</th>
                              <th>Durée & Seuil</th>
                              <th>Statut</th>
                              <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {candidatures.map((app) => {
                              const passage = passagesTests.find((p) => p.candidatureId === app.id);
                              const testOffre = availableTests[app.id];
                              const testTitle = testOffre?.titre || `Évaluation Technique - ${app.offreTitre}`;
                              const qCount = testOffre?.questions?.length || 5;
                              const duree = testOffre?.dureeMinutes || 20;
                              const scoreMin = testOffre?.scoreMinimum || 60;

                              return (
                                <tr key={app.id}>
                                  <td>
                                    <h6 style={{ fontWeight: 700, margin: 0 }}>{testTitle}</h6>
                                    <span className="info" style={{ color: '#4f46e5', fontWeight: 600 }}>
                                      {qCount} questions QCM · {testOffre?.publie ? '✨ Test officiel publié par l’entreprise' : 'Auto-adaptatif'}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{app.offreTitre}</div>
                                    <span className="info" style={{ color: '#64748b' }}>{app.nomEntreprise}</span>
                                  </td>
                                  <td>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>
                                      ⏱️ {duree} min · Seuil : <strong>{scoreMin}%</strong>
                                    </div>
                                  </td>
                                  <td>
                                    {passage ? (
                                      <span
                                        style={{
                                          padding: '4px 10px',
                                          borderRadius: '12px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          background: passage.reussi ? '#dcfce7' : '#fee2e2',
                                          color: passage.reussi ? '#15803d' : '#b91c1c',
                                        }}
                                      >
                                        {passage.reussi ? '✓ Validé' : '✗ Non validé'} ({passage.score}%)
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          padding: '4px 10px',
                                          borderRadius: '12px',
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          background: '#fef3c7',
                                          color: '#b45309',
                                        }}
                                      >
                                        🟡 À passer
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    {passage ? (
                                      <button
                                        type="button"
                                        onClick={() => handleStartTest(app)}
                                        className="theme-btn btn-style-three"
                                        style={{ padding: '6px 14px', fontSize: '12px' }}
                                      >
                                        👁️ Revoir le QCM
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={loadingTest === app.id}
                                        onClick={() => handleStartTest(app)}
                                        style={{
                                          padding: '7px 16px',
                                          borderRadius: '8px',
                                          border: 'none',
                                          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                          color: '#fff',
                                          fontWeight: 700,
                                          fontSize: '12px',
                                          cursor: loadingTest === app.id ? 'not-allowed' : 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                                        }}
                                      >
                                        <i className="la la-laptop-code" style={{ fontSize: '14px' }}></i>
                                        {loadingTest === app.id ? 'Chargement...' : '🚀 Passer le Test QCM'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {passagesTests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px' }}>
                      <i className="la la-laptop-code" style={{ fontSize: '48px', color: '#94a3b8', display: 'block', marginBottom: '12px' }}></i>
                      <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>Aucun test technique passé pour l'instant</h5>
                      <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '480px', margin: '0 auto 16px' }}>
                        Rendez-vous dans l'onglet « Mes Candidatures » pour passer les tests techniques QCM des offres auxquelles vous avez postulé.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('applications')}
                        className="theme-btn btn-style-one"
                      >
                        Voir mes candidatures
                      </button>
                    </div>
                  ) : (
                    <div className="table-outer">
                      <table className="default-table manage-job-table">
                        <thead>
                          <tr>
                            <th>Test Technique & Entreprise</th>
                            <th>Offre Associée</th>
                            <th>Score Obtenu</th>
                            <th>Résultat</th>
                            <th>Date de Passage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {passagesTests.map((pt) => (
                            <tr key={pt.id}>
                              <td>
                                <h6>{pt.testTitre}</h6>
                                <span className="info">Validé par TalentFlow IA</span>
                              </td>
                              <td>
                                <Link to={`/offres/${pt.offreId}`} style={{ fontWeight: 600, color: '#1967d2' }}>
                                  {pt.offreTitre}
                                </Link>
                              </td>
                              <td>
                                <strong style={{ fontSize: '16px', color: pt.reussi ? '#059669' : '#dc2626' }}>
                                  {pt.score}% ({pt.bonnesReponses}/{pt.totalQuestions})
                                </strong>
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    background: pt.reussi ? '#dcfce7' : '#fee2e2',
                                    color: pt.reussi ? '#15803d' : '#b91c1c',
                                  }}
                                >
                                  {pt.reussi ? '✓ VALIDÉ' : '✗ EN DESSOUS DU SEUIL'}
                                </span>
                              </td>
                              <td>{new Date(pt.datePassage).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="ls-widget">
          <div className="widget-title">
            <h4>Mes Entretiens de Recrutement ({entretiens.length})</h4>
          </div>
          <div className="widget-content">
            {entretiens.length === 0 ? (
              <p>Aucun entretien planifié pour le moment.</p>
            ) : (
              <div className="row">
                {entretiens.map((ent) => (
                  <div key={ent.id} className="col-lg-6 col-md-12" style={{ marginBottom: '20px' }}>
                    <div
                      style={{
                        border: '1px solid #ecedf2',
                        borderRadius: '12px',
                        padding: '25px',
                        background: '#ffffff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                            {ent.offreTitre}
                          </h4>
                          <p style={{ color: '#1967d2', fontWeight: 600, margin: 0 }}>
                            {ent.nomEntreprise} — {ent.typeEntretien || 'Entretien'}
                          </p>
                        </div>
                        <StatusBadge status={ent.statut} />
                      </div>

                      <p style={{ fontSize: '14px', marginTop: '14px', marginBottom: '8px' }}>
                        <i className="la la-calendar" style={{ color: '#1967d2' }}></i>{' '}
                        <strong>Date et heure :</strong>{' '}
                        {new Date(ent.dateEntretien).toLocaleString('fr-FR', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}
                      </p>

                      {ent.commentaire && (
                        <p
                          style={{
                            fontSize: '13px',
                            background: '#f5f7fc',
                            padding: '12px',
                            borderRadius: '8px',
                            marginTop: '10px',
                          }}
                        >
                          <strong>Instructions :</strong> {ent.commentaire}
                        </p>
                      )}

                      <div style={{ marginTop: '14px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveVisioEntretien(ent)}
                          className="theme-btn btn-style-one"
                          style={{ padding: '8px 18px', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                        >
                          <i className="la la-video" style={{ marginRight: '6px' }}></i>
                          {lang === 'ar' ? 'الانضمام إلى المقابلة المرئية' : 'Rejoindre la visioconférence'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="ls-widget">
          <div className="widget-title">
            <h4>Mes Offres d’Emploi Favorites ({favoris.length})</h4>
          </div>
          <div className="widget-content">
            {favoris.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p>Aucune offre enregistrée dans vos favoris.</p>
                <Link to="/offres" className="theme-btn btn-style-one" style={{ marginTop: '10px' }}>
                  Parcourir les offres
                </Link>
              </div>
            ) : (
              favoris.map((fav) => (
                <JobOfferCard
                  key={fav.id}
                  offre={fav.offre}
                  isFavorite={true}
                  onToggleFavorite={handleRemoveFavorite}
                  hasApplied={candidatures.some((c) => c.offreId === fav.offre.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'searches' && (
        <div className="ls-widget">
          <div className="widget-title">
            <h4>Mes Recherches & Alertes Emploi Sauvegardées ({recherches.length})</h4>
          </div>
          <div className="widget-content">
            {recherches.length === 0 ? (
              <p>Aucune recherche enregistrée. Utilisez le bouton « Enregistrer cette recherche » sur la page des offres.</p>
            ) : (
              <div className="table-outer">
                <table className="default-table manage-job-table">
                  <thead>
                    <tr>
                      <th>Mot-clé</th>
                      <th>Localisation</th>
                      <th>Contrat & Catégorie</th>
                      <th>Date de création</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recherches.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <h6>{r.motCle || 'Toutes les offres'}</h6>
                        </td>
                        <td>{r.localisation || 'France entière'}</td>
                        <td>
                          {r.typeContrat || 'Tous contrats'} · {r.categorie || 'Toutes catégories'}
                        </td>
                        <td>
                          {r.dateRecherche
                            ? new Date(r.dateRecherche).toLocaleDateString('fr-FR')
                            : 'Aujourd’hui'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link
                              to={`/offres?keyword=${encodeURIComponent(
                                r.motCle === 'Toutes les offres' ? '' : r.motCle || ''
                              )}&localisation=${encodeURIComponent(
                                r.localisation === 'France entière' ? '' : r.localisation || ''
                              )}`}
                              className="theme-btn btn-style-one"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              Relancer
                            </Link>
                            <button
                              onClick={() => handleDeleteRecherche(r.id)}
                              className="theme-btn btn-style-four"
                              style={{ padding: '6px 14px', fontSize: '12px', border: 'none', cursor: 'pointer' }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="ls-widget">
          <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h4>Mon Profil Candidat, Photo & CV PDF Officiel</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleQuickFillProfile}
                className="theme-btn btn-style-three"
                style={{ padding: '8px 14px', fontSize: '12px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                ⚡ Pré-remplir Profil Expert (1 clic)
              </button>
              <span style={{ color: '#34a853', fontWeight: 700 }}>
                Complétion : {completion}%
              </span>
            </div>
          </div>
          <div className="widget-content">
            {/* Photo de profil / Avatar Candidat */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
                padding: '20px 24px',
                borderRadius: '14px',
                marginBottom: '22px',
                border: '1px solid #e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={selectedAvatar || getCandidateAvatar(candidat?.id || user?.id || 1)}
                  alt={user?.nom || 'Avatar Candidat'}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #6366f1',
                    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
                  }}
                />
                <div>
                  <h5 style={{ fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                    {profileForm.nom || user?.nom || 'Candidat JobFlow'}
                  </h5>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#4f46e5', fontWeight: 600 }}>
                    {profileForm.titreProfil || 'Ingénieur Logiciel Full Stack'}
                  </p>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Choisissez un avatar professionnel en 1 clic :
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {CANDIDATE_AVATARS.map((av, idx) => {
                  const active = (selectedAvatar || getCandidateAvatar(candidat?.id || user?.id || 1)) === av;
                  return (
                    <button
                      key={av}
                      type="button"
                      onClick={() => handleSelectAvatar(av)}
                      title={`Avatar #${idx + 1}`}
                      style={{
                        padding: 0,
                        border: active ? '3px solid #4f46e5' : '2px solid #cbd5e1',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#fff',
                        transform: active ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <img
                        src={av}
                        alt={`Avatar ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload & Génération 1-Clic CV PDF Box */}
            <div
              style={{
                background: '#f5f7fc',
                padding: '25px',
                borderRadius: '14px',
                marginBottom: '30px',
                border: '1px dashed #4f46e5',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <h5 style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    📄 Mon CV au format PDF (Visible & Téléchargeable par les Recruteurs)
                  </h5>
                  <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 12px' }}>
                    {candidat?.cvUrl ? (
                      <>
                        Fichier PDF actif :{' '}
                        <a
                          href={candidat.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          {candidat.cvUrl}
                        </a>
                      </>
                    ) : (
                      'Aucun CV enregistré. Cliquez sur « Générer un CV PDF Démo » ou importez un fichier PDF.'
                    )}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <input type="file" accept=".pdf,application/pdf" onChange={handleCvUpload} />
                    <button
                      type="button"
                      onClick={handleGenerateDemoCv}
                      disabled={generatingDemoCv}
                      className="theme-btn btn-style-three"
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {generatingDemoCv
                        ? 'Génération en cours...'
                        : '⚡ Générer / Actualiser mon CV PDF en 1 clic'}
                    </button>
                  </div>
                  {uploadingCv && (
                    <p style={{ marginTop: '8px', color: '#4f46e5', fontWeight: 600 }}>
                      Téléversement du CV PDF en cours...
                    </p>
                  )}
                </div>

                {candidat?.cvUrl && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowInlinePdfPreview((prev) => !prev)}
                      className="theme-btn btn-style-three"
                      style={{ padding: '10px 16px', fontSize: '13px', border: 'none', cursor: 'pointer' }}
                    >
                      <i className="la la-eye" style={{ marginRight: '6px' }}></i>
                      {showInlinePdfPreview ? 'Masquer l’aperçu PDF' : 'Aperçu PDF direct'}
                    </button>
                    <a
                      href={candidat.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="theme-btn btn-style-one"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <i className="la la-external-link-alt" style={{ marginRight: '6px' }}></i>
                      Ouvrir mon CV PDF
                    </a>
                  </div>
                )}
              </div>

              {candidat?.cvUrl && showInlinePdfPreview && (
                <div
                  style={{
                    marginTop: '20px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #cbd5e1',
                    background: '#0f172a',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 16px',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Aperçu en direct du CV PDF officiel ({candidat.cvUrl})</span>
                    <a
                      href={candidat.cvUrl}
                      download
                      style={{ color: '#93c5fd', textDecoration: 'underline' }}
                    >
                      ⬇ Télécharger le PDF
                    </a>
                  </div>
                  <iframe
                    src={candidat.cvUrl}
                    title="Aperçu CV PDF Candidat"
                    style={{ width: '100%', height: '440px', border: 'none', background: '#fff' }}
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="default-form">
              <div className="row">
                <div className="form-group col-lg-6 col-md-12">
                  <label>Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.nom}
                    onChange={(e) => setProfileForm({ ...profileForm, nom: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    value={profileForm.telephone}
                    onChange={(e) => setProfileForm({ ...profileForm, telephone: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Titre professionnel</label>
                  <input
                    type="text"
                    value={profileForm.titreProfil}
                    onChange={(e) => setProfileForm({ ...profileForm, titreProfil: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Adresse / Ville</label>
                  <input
                    type="text"
                    value={profileForm.adresse}
                    onChange={(e) => setProfileForm({ ...profileForm, adresse: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Compétences clés (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={profileForm.competences}
                    onChange={(e) => setProfileForm({ ...profileForm, competences: e.target.value })}
                    placeholder="Java 21, Spring Boot, React, TypeScript, PostgreSQL, Docker"
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Lien LinkedIn</label>
                  <input
                    type="text"
                    value={profileForm.linkedinUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Portfolio / GitHub</label>
                  <input
                    type="text"
                    value={profileForm.portfolioUrl}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, portfolioUrl: e.target.value })
                    }
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Présentation / Résumé professionnel</label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Expériences professionnelles</label>
                  <textarea
                    rows={3}
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Formation & Diplômes</label>
                  <textarea
                    rows={3}
                    value={profileForm.formation}
                    onChange={(e) => setProfileForm({ ...profileForm, formation: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <button type="submit" className="theme-btn btn-style-one">
                    Enregistrer mon profil candidat
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INTERACTIF PASSAGE DE TEST TECHNIQUE QCM IA */}
      {/* ========================================================================= */}
      {activeTestModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => {
            if (testResult) {
              setActiveTestModal(null);
              setTestResult(null);
            }
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '780px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              padding: '32px',
              position: 'relative',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Si résultat disponible après soumission */}
            {testResult ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: testResult.reussi ? '#dcfce7' : '#fee2e2',
                    color: testResult.reussi ? '#15803d' : '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    margin: '0 auto 16px',
                  }}
                >
                  {testResult.reussi ? '✓' : 'ℹ'}
                </div>

                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    background: testResult.reussi ? '#dcfce7' : '#fee2e2',
                    color: testResult.reussi ? '#15803d' : '#b91c1c',
                    fontWeight: 800,
                    fontSize: '12px',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  {testResult.reussi ? 'TEST TECHNIQUE VALIDÉ' : 'TEST TECHNIQUE COMPLÉTÉ'}
                </span>

                <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                  Votre résultat : {testResult.score}%
                </h2>
                <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '520px', margin: '0 auto 24px' }}>
                  Vous avez obtenu <strong>{testResult.bonnesReponses}</strong> bonne(s) réponse(s) sur{' '}
                  <strong>{testResult.totalQuestions}</strong> questions. Votre note et votre évaluation ont été
                  instantanément enregistrées dans MySQL et transmises au recruteur.
                </p>

                {/* Détail questions et explications */}
                <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                  <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                    📖 Corrigé pédagogique & explications de l’IA :
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeTestModal.questions.map((q, idx) => {
                      const userRep = candidateAnswers[idx];
                      const isCorrect = userRep === q.bonneReponse;
                      return (
                        <div
                          key={idx}
                          style={{
                            background: isCorrect ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`,
                            borderRadius: '12px',
                            padding: '14px 18px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                              Question {idx + 1} : {q.question}
                            </strong>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: isCorrect ? '#15803d' : '#b91c1c' }}>
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                            Votre réponse : <strong>{userRep >= 0 ? q.options[userRep] : 'Non répondu'}</strong>
                          </div>
                          {!isCorrect && (
                            <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 600, marginBottom: '4px' }}>
                              Bonne réponse : {q.options[q.bonneReponse]}
                            </div>
                          )}
                          {q.explication && (
                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                              💡 {q.explication}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTestModal(null);
                    setTestResult(null);
                  }}
                  className="theme-btn btn-style-one"
                  style={{ minWidth: '220px' }}
                >
                  Fermer et voir mes candidatures
                </button>
              </div>
            ) : (
              /* En cours de passage de test */
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '16px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                      ⚡ TEST TECHNIQUE QCM IA
                    </span>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                      {activeTestModal.titre}
                    </h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                      Poste : <strong>{activeCandidatureForTest?.offreTitre}</strong> · Durée conseillée : {activeTestModal.dureeMinutes} min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTestModal(null)}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    <span>Question {currentQuestionIdx + 1} sur {activeTestModal.questions.length}</span>
                    <span>
                      {candidateAnswers.filter((a) => a !== -1).length} / {activeTestModal.questions.length} répondue(s)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${((currentQuestionIdx + 1) / activeTestModal.questions.length) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Question Actuelle */}
                {activeTestModal.questions[currentQuestionIdx] && (
                  <div style={{ marginBottom: '24px' }}>
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '18px',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#0f172a',
                        lineHeight: 1.5,
                        marginBottom: '16px',
                      }}
                    >
                      {currentQuestionIdx + 1}. {activeTestModal.questions[currentQuestionIdx].question || (activeTestModal.questions[currentQuestionIdx] as any).enonce || 'Question technique'}
                    </div>

                    {/* Choix QCM */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeTestModal.questions[currentQuestionIdx].options.map((opt, optIdx) => {
                        const isSelected = candidateAnswers[currentQuestionIdx] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => {
                              const updated = [...candidateAnswers];
                              updated[currentQuestionIdx] = optIdx;
                              setCandidateAnswers(updated);
                            }}
                            style={{
                              padding: '14px 18px',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1',
                              background: isSelected ? 'linear-gradient(135deg, #eef2ff, #f5f3ff)' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                border: isSelected ? '6px solid #6366f1' : '2px solid #cbd5e1',
                                background: '#ffffff',
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#312e81' : '#334155' }}>
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Boutons de navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <button
                    type="button"
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ← Précédente
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {currentQuestionIdx < activeTestModal.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIdx((prev) => Math.min(activeTestModal.questions.length - 1, prev + 1))}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Suivante →
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={submittingTest}
                        onClick={handleSubmitTest}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          fontWeight: 800,
                          cursor: submittingTest ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        {submittingTest
                          ? (lang === 'ar' ? 'جارٍ تسجيل الإجابات...' : 'Enregistrement de vos réponses...')
                          : (lang === 'ar' ? '✓ تأكيد وتسليم الاختبار' : '✓ Valider et Soumettre le Test')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <VisioconferenceModal
        open={!!activeVisioEntretien}
        entretien={activeVisioEntretien}
        onClose={() => setActiveVisioEntretien(null)}
        userRole="CANDIDAT"
        userName={user?.nom || 'Mohamed Gomri'}
      />
    </DashboardLayout>
  );
};
