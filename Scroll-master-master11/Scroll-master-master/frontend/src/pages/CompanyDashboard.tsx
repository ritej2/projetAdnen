import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  professionalToast as toast,
  confirmProfessionalAction,
  showProfessionalSuccessModal,
} from '../services/alertService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Candidature, Entretien, Offre, StatutCandidature, EvaluationIA, TestTechnique, PassageTest, QuestionDTO, PassageDetailDTO, AgentChatResponse } from '../types';
import { DashboardLayout } from '../layouts/MainLayouts';
import { KpiCard, StatusBadge, formatSalaryRange } from '../components/SharedComponents';
import { uploadDocumentOrLogo } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { VisioconferenceModal } from '../components/VisioconferenceModal';

export const CompanyDashboard: React.FC = () => {
  const { user, entreprise, loading, refreshProfile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [offres, setOffres] = useState<Offre[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [evaluationsIA, setEvaluationsIA] = useState<Record<number, EvaluationIA>>({});
  const [testsTechniques, setTestsTechniques] = useState<TestTechnique[]>([]);
  const [passagesTests, setPassagesTests] = useState<PassageTest[]>([]);
  const [stats, setStats] = useState<any>({});

  const [filterOfferId, setFilterOfferId] = useState<string>('ALL');
  const [filterAppStatus, setFilterAppStatus] = useState<string>('EN_ATTENTE');

  // Modal Évaluation IA
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationIA | null>(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState<number | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [validatingDecision, setValidatingDecision] = useState(false);

  // Modal Création Test IA & Studio Agent IA
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [targetOfferForTest, setTargetOfferForTest] = useState<Offre | null>(null);
  const [testForm, setTestForm] = useState({
    titre: '',
    description: '',
    dureeMinutes: 20,
    scoreMinimum: 60,
    competencesCibles: '',
  });
  const [creatingTest, setCreatingTest] = useState(false);
  const [activeVisioEntretien, setActiveVisioEntretien] = useState<Entretien | null>(null);

  // --- STUDIO AGENT IA & VÉRIFICATEUR DE TEST (QCM INTERACTIF) ---
  const [studioOpen, setStudioOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [studioOffre, setStudioOffre] = useState<Offre | null>(null);
  const [studioTitre, setStudioTitre] = useState('');
  const [studioDescription, setStudioDescription] = useState('');
  const [studioDuree, setStudioDuree] = useState(20);
  const [studioScoreMin, setStudioScoreMin] = useState(60);
  const [studioQuestions, setStudioQuestions] = useState<QuestionDTO[]>([]);
  const [studioChatHistory, setStudioChatHistory] = useState<
    { role: 'user' | 'agent'; text: string; time: string }[]
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [agentThinking, setAgentThinking] = useState(false);
  const [savingStudioTest, setSavingStudioTest] = useState(false);
  const [studioView, setStudioView] = useState<'chat' | 'test' | 'split'>('split');

  // Modal Détail Réponses Candidat
  const [selectedPassageDetail, setSelectedPassageDetail] = useState<PassageDetailDTO | null>(null);
  const [loadingPassageDetail, setLoadingPassageDetail] = useState<number | null>(null);

  // Offer Form Modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offre | null>(null);
  const [offerForm, setOfferForm] = useState({
    titre: '',
    description: '',
    missions: '',
    profilRecherche: '',
    localisation: 'Paris, France',
    modeTravail: 'Hybride',
    categorie: 'Ingénierie & Tech',
    typeContrat: 'CDI',
    niveauExperience: 'Confirmé (3–5 ans)',
    competencesRequises: '',
    salaire: '55000',
    salaireMax: '68000',
    statut: 'ACTIVE',
  });

  // Interview Schedule Modal
  const [scheduleTarget, setScheduleTarget] = useState<Candidature | null>(null);
  const [selectedCandidateProfile, setSelectedCandidateProfile] = useState<Candidature | null>(null);
  const [interviewForm, setInterviewForm] = useState({
    dateEntretien: '2026-10-25T14:30',
    typeEntretien: 'Visioconférence Technique',
    lienOuLieu: 'https://meet.superio-emploi.fr/entretien-direct',
    commentaire: 'Entretien technique de 45 minutes avec le Lead Tech.',
  });

  // Company Profile state
  const [compForm, setCompForm] = useState({
    nomEntreprise: '',
    nomContact: '',
    telephone: '',
    secteur: '',
    description: '',
    adresse: '',
    siteWeb: '',
    tailleEntreprise: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadCompanyData = async () => {
    try {
      const [offresRes, appsRes, intRes, statsRes, testsRes, passagesRes, evalsRes] = await Promise.all([
        api.get('/api/offres/me'),
        api.get('/api/candidatures/entreprise'),
        api.get('/api/entretiens/me'),
        api.get('/api/stats/entreprise'),
        api.get('/api/evaluations-tests/tests/entreprise').catch(() => ({ data: [] })),
        api.get('/api/evaluations-tests/tests/passages-entreprise').catch(() => ({ data: [] })),
        api.get('/api/evaluations-tests/entreprise').catch(() => ({ data: [] })),
      ]);
      setOffres(offresRes.data || []);
      setCandidatures(appsRes.data || []);
      setEntretiens(intRes.data || []);
      setStats(statsRes.data || {});
      setTestsTechniques(testsRes.data || []);
      setPassagesTests(passagesRes.data || []);

      const mapEvals: Record<number, EvaluationIA> = {};
      (evalsRes.data || []).forEach((ev: EvaluationIA) => {
        mapEvals[ev.candidatureId] = ev;
      });
      setEvaluationsIA(mapEvals);
    } catch {
      // handled gracefully
    }
  };

  const handleOpenEvaluationModal = async (c: Candidature) => {
    setLoadingEvaluation(c.id);
    setDecisionComment(c.noteRecruteur || '');
    try {
      const res = await api.post(`/api/evaluations-tests/evaluer/${c.id}`);
      setSelectedEvaluation(res.data);
      setEvaluationsIA((prev) => ({ ...prev, [c.id]: res.data }));
    } catch (err: any) {
      toast.error(err, 'Analyse IA impossible');
    } finally {
      setLoadingEvaluation(null);
    }
  };

  const handleValiderDecision = async (candidatureId: number, decision: 'ACCEPTEE' | 'ENTRETIEN' | 'REFUSEE') => {
    setValidatingDecision(true);
    try {
      const res = await api.post(`/api/evaluations-tests/valider/${candidatureId}`, {
        decision,
        commentaire: decisionComment || `Candidature ${decision === 'ACCEPTEE' ? 'retenue' : decision === 'ENTRETIEN' ? 'sélectionnée pour entretien' : 'non retenue'} après évaluation IA.`,
      });
      setSelectedEvaluation(res.data);
      setEvaluationsIA((prev) => ({ ...prev, [candidatureId]: res.data }));
      await loadCompanyData();
      await showProfessionalSuccessModal(
        `Décision validée : ${decision}`,
        `Le statut de la candidature a été mis à jour sur ${decision} et notifié au candidat.`
      );
    } catch (err: any) {
      toast.error(err, 'Validation de la décision');
    } finally {
      setValidatingDecision(false);
    }
  };

  const handleCreateTestIa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOfferForTest) return;
    setCreatingTest(true);
    try {
      const res = await api.post('/api/evaluations-tests/tests', {
        offreId: targetOfferForTest.id,
        titre: testForm.titre || `Test Technique IA - ${targetOfferForTest.titre}`,
        description: testForm.description || `Évaluation interactive des compétences requises pour le poste.`,
        dureeMinutes: Number(testForm.dureeMinutes) || 20,
        scoreMinimum: Number(testForm.scoreMinimum) || 60,
        competencesCibles: testForm.competencesCibles || targetOfferForTest.competencesRequises,
      });
      setShowCreateTestModal(false);
      await loadCompanyData();
      await showProfessionalSuccessModal(
        'Test Technique IA Créé !',
        `Le QCM (${res.data.questions?.length || 5} questions) a été généré et attaché à l'offre « ${targetOfferForTest.titre} » avec succès.`
      );
    } catch (err: any) {
      toast.error(err, 'Création du test technique');
    } finally {
      setCreatingTest(false);
    }
  };

  const openTestStudio = (test?: TestTechnique, offre?: Offre) => {
    const selectedOffre = offre || (test ? offres.find((o) => o.id === test.offreId) : null) || offres[0] || null;
    setStudioOffre(selectedOffre);

    if (test) {
      setEditingTestId(test.id);
      setStudioTitre(test.titre);
      setStudioDescription(test.description || '');
      setStudioDuree(test.dureeMinutes || 20);
      setStudioScoreMin(test.scoreMinimum || 60);
      setStudioQuestions(test.questions ? JSON.parse(JSON.stringify(test.questions)) : []);
      setStudioChatHistory([
        {
          role: 'agent',
          text: `Bonjour ! Je suis votre agent IA dédié aux évaluations techniques. Vous êtes en train de vérifier et modifier le test « ${test.titre} » (${test.questions?.length || 0} questions). Vous pouvez me demander d'ajouter de nouvelles questions, d'ajuster le niveau de difficulté ou de modifier les questions directement dans la boîte de test.`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setStudioView('test');
    } else {
      setEditingTestId(null);
      const defaultTitre = selectedOffre ? `Évaluation Technique - ${selectedOffre.titre}` : 'Nouveau Test Technique QCM';
      setStudioTitre(defaultTitre);
      setStudioDescription('Évaluation interactive des compétences requises pour le poste.');
      setStudioDuree(20);
      setStudioScoreMin(60);
      setStudioQuestions([]);
      setStudioChatHistory([
        {
          role: 'agent',
          text: `Bonjour ! Je suis votre agent IA de recrutement. Pour l'offre « ${selectedOffre?.titre || 'Poste'} », dites-moi ce que vous souhaitez tester (ex: « Génère un test de 5 questions sur ${selectedOffre?.competencesRequises || 'Java, React et SQL'} niveau confirmé ») et je vais composer le QCM pour vous.`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setStudioView('chat');
    }
    setStudioOpen(true);
  };

  const handleSendAgentMessage = async (customMessage?: string) => {
    const text = (customMessage || chatInput).trim();
    if (!text || agentThinking) return;

    const userMsgTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setStudioChatHistory((prev) => [...prev, { role: 'user', text, time: userMsgTime }]);
    if (!customMessage) setChatInput('');
    setAgentThinking(true);

    try {
      const res = await api.post<AgentChatResponse>('/api/evaluations-tests/agent-chat', {
        offreId: studioOffre?.id,
        message: text,
        questionsActuelles: studioQuestions,
        dureeMinutes: studioDuree,
        scoreMinimum: studioScoreMin,
        titreTest: studioTitre,
      });

      const reply = res.data;
      const agentMsgTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setStudioChatHistory((prev) => [
        ...prev,
        { role: 'agent', text: reply.messageAgent, time: agentMsgTime },
      ]);

      if (reply.questions && reply.questions.length > 0) {
        setStudioQuestions(reply.questions);
      }
      if (reply.titreTest) setStudioTitre(reply.titreTest);
      if (reply.description) setStudioDescription(reply.description);
      if (reply.dureeMinutes) setStudioDuree(reply.dureeMinutes);
      if (reply.scoreMinimum) setStudioScoreMin(reply.scoreMinimum);

      toast.success('Test mis à jour par l’agent IA !');
    } catch (err: any) {
      const agentMsgTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setStudioChatHistory((prev) => [
        ...prev,
        {
          role: 'agent',
          text: "Désolé, une erreur s'est produite lors de l'échange avec l'agent IA. Vous pouvez réessayer ou modifier les questions manuellement à droite.",
          time: agentMsgTime,
        },
      ]);
      toast.error('Erreur lors de la communication avec l’agent IA');
    } finally {
      setAgentThinking(false);
    }
  };

  const handleUpdateQuestion = (index: number, updated: Partial<QuestionDTO>) => {
    setStudioQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updated } : q))
    );
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    setStudioQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleDeleteQuestion = (index: number) => {
    setStudioQuestions((prev) => prev.filter((_, i) => i !== index));
    toast.info('Question supprimée.');
  };

  const handleAddManualQuestion = () => {
    const newQ: QuestionDTO = {
      id: Date.now(),
      question: 'Nouvelle question technique à éditer ?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      bonneReponse: 0,
      explication: 'Explication technique détaillée de la solution.',
    };
    setStudioQuestions((prev) => [...prev, newQ]);
    toast.success('Nouvelle question ajoutée au studio !');
  };

  const handleSaveStudioTest = async (publier: boolean) => {
    if (!studioOffre) {
      toast.warning('Veuillez sélectionner une offre d’emploi associée.');
      return;
    }
    if (studioQuestions.length === 0) {
      toast.warning('Le test doit comporter au moins une question QCM.');
      return;
    }

    let finalTitre = studioTitre.trim();

    // Si on publie le test, demander à l'utilisateur de confirmer ou personnaliser le nom du test
    if (publier) {
      const defaultName = finalTitre || (studioOffre ? `Évaluation Technique - ${studioOffre.titre}` : 'Test Technique QCM');
      const { value: nomSaisi, isConfirmed } = await Swal.fire({
        title: 'Nom du Test Technique',
        text: 'Veuillez saisir ou confirmer le nom de ce test avant de le publier pour les candidats :',
        input: 'text',
        inputValue: defaultName,
        inputPlaceholder: 'Ex: Évaluation Senior React & Spring Boot',
        showCancelButton: true,
        confirmButtonText: '🚀 Confirmer et Publier',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b',
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return 'Le nom du test technique est obligatoire.';
          }
          return null;
        },
      });

      if (!isConfirmed || !nomSaisi) {
        return; // L'utilisateur a annulé la publication
      }
      finalTitre = nomSaisi.trim();
      setStudioTitre(finalTitre);
    }

    setSavingStudioTest(true);
    try {
      const payload = {
        offreId: studioOffre.id,
        titre: finalTitre || `Test Technique - ${studioOffre.titre}`,
        description: studioDescription.trim() || 'Évaluation technique',
        dureeMinutes: Number(studioDuree) || 20,
        scoreMinimum: Number(studioScoreMin) || 60,
        questions: studioQuestions,
        publie: publier,
        statut: publier ? 'PUBLIE' : 'BROUILLON',
      };

      if (editingTestId) {
        await api.put(`/api/evaluations-tests/tests/${editingTestId}`, payload);
      } else {
        await api.post('/api/evaluations-tests/tests', payload);
      }

      setStudioOpen(false);
      await loadCompanyData();

      await showProfessionalSuccessModal(
        publier ? '🚀 Test Validé & Publié !' : '💾 Brouillon Enregistré',
        publier
          ? `Le test « ${payload.titre} » est désormais actif et disponible pour les candidats postulant à « ${studioOffre.titre} ».`
          : `Le test « ${payload.titre} » a été sauvegardé en brouillon. Vous pourrez continuer à l'éditer avec l'agent IA et le publier.`
      );
    } catch (err: any) {
      toast.error(err, 'Enregistrement du test');
    } finally {
      setSavingStudioTest(false);
    }
  };

  const handleQuickPublishTest = async (testId: number) => {
    try {
      await api.patch(`/api/evaluations-tests/tests/${testId}/publier`);
      toast.success('Test technique validé et publié avec succès !');
      await loadCompanyData();
    } catch {
      toast.error('Impossible de publier ce test.');
    }
  };

  const handleViewPassageDetail = async (passageId: number) => {
    setLoadingPassageDetail(passageId);
    try {
      const res = await api.get<PassageDetailDTO>(`/api/evaluations-tests/passages/${passageId}/details`);
      setSelectedPassageDetail(res.data);
    } catch (err: any) {
      toast.error('Impossible de récupérer les détails des réponses.');
    } finally {
      setLoadingPassageDetail(null);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth?mode=login&role=ENTREPRISE', { replace: true });
      return;
    }
    if (user.role !== 'ENTREPRISE') {
      navigate(user.role === 'ADMIN' ? '/admin' : '/candidat', { replace: true });
      return;
    }
    loadCompanyData();
  }, [loading, user?.id, user?.role]);

  useEffect(() => {
    if (entreprise) {
      setCompForm({
        nomEntreprise: entreprise.nomEntreprise || '',
        nomContact: entreprise.nomContact || '',
        telephone: entreprise.telephone || '',
        secteur: entreprise.secteur || '',
        description: entreprise.description || '',
        adresse: entreprise.adresse || '',
        siteWeb: entreprise.siteWeb || '',
        tailleEntreprise: entreprise.tailleEntreprise || '',
      });
    }
  }, [entreprise]);

  const openNewOfferModal = () => {
    setEditingOffer(null);
    setOfferForm({
      titre: '',
      description: '',
      missions: '',
      profilRecherche: '',
      localisation: entreprise?.adresse || 'Paris, France',
      modeTravail: 'Hybride',
      categorie: 'Ingénierie & Tech',
      typeContrat: 'CDI',
      niveauExperience: 'Confirmé (3–5 ans)',
      competencesRequises: 'Java 21, Spring Boot, React, PostgreSQL',
      salaire: '55000',
      salaireMax: '68000',
      statut: 'ACTIVE',
    });
    setShowOfferModal(true);
  };

  const openEditOfferModal = (o: Offre) => {
    setEditingOffer(o);
    setOfferForm({
      titre: o.titre,
      description: o.description,
      missions: o.missions || '',
      profilRecherche: o.profilRecherche || '',
      localisation: o.localisation,
      modeTravail: o.modeTravail || 'Hybride',
      categorie: o.categorie || 'Ingénierie & Tech',
      typeContrat: o.typeContrat,
      niveauExperience: o.niveauExperience || 'Confirmé (3–5 ans)',
      competencesRequises: o.competencesRequises || '',
      salaire: o.salaire ? String(o.salaire) : '',
      salaireMax: o.salaireMax ? String(o.salaireMax) : '',
      statut: o.statut,
    });
    setShowOfferModal(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...offerForm,
        salaire: offerForm.salaire ? Number(offerForm.salaire) : null,
        salaireMax: offerForm.salaireMax ? Number(offerForm.salaireMax) : null,
      };
      if (editingOffer) {
        await api.put(`/api/offres/${editingOffer.id}`, payload);
        await showProfessionalSuccessModal(
          'Offre mise à jour',
          `L’offre « ${offerForm.titre} » a été enregistrée avec succès.`
        );
      } else {
        await api.post('/api/offres', payload);
        await showProfessionalSuccessModal(
          'Nouvelle offre publiée !',
          `L’offre « ${offerForm.titre} » est désormais visible par les candidats.`
        );
      }
      setShowOfferModal(false);
      await loadCompanyData();
    } catch (err: any) {
      toast.error(err, 'Enregistrement de l’offre');
    }
  };

  const handleDeleteOffer = async (id: number) => {
    const confirmed = await confirmProfessionalAction(
      'Supprimer cette offre d’emploi ?',
      'Cette action supprimera définitivement l’offre ainsi que les candidatures associées.',
      'Oui, supprimer',
      'Annuler'
    );
    if (!confirmed) return;
    try {
      await api.delete(`/api/offres/${id}`);
      toast.info('Offre d’emploi supprimée.');
      await loadCompanyData();
    } catch (err) {
      toast.error(err, 'Suppression impossible');
    }
  };

  const handleUpdateCandidatureStatus = async (
    candidatureId: number,
    statut: StatutCandidature,
    note?: string
  ) => {
    try {
      await api.patch(`/api/candidatures/${candidatureId}/statut`, {
        statut,
        noteRecruteur: note,
      });
      toast.success(
        statut === 'ACCEPTEE'
          ? 'Candidature acceptée ! Elle a été retirée de la liste en attente.'
          : statut === 'REFUSEE'
          ? 'Candidature refusée.'
          : `Statut de la candidature mis à jour (${statut})`
      );
      setCandidatures((prev) =>
        prev.map((c) => (c.id === candidatureId ? { ...c, statut, noteRecruteur: note || c.noteRecruteur } : c))
      );
      await loadCompanyData();
    } catch {
      toast.error('Impossible de mettre à jour le statut.');
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTarget) return;
    try {
      await api.post('/api/entretiens', {
        candidatureId: scheduleTarget.id,
        dateEntretien:
          interviewForm.dateEntretien.length === 16
            ? `${interviewForm.dateEntretien}:00`
            : interviewForm.dateEntretien,
        typeEntretien: interviewForm.typeEntretien,
        lienOuLieu: interviewForm.lienOuLieu,
        commentaire: interviewForm.commentaire,
      });
      toast.success(`Entretien programmé avec ${scheduleTarget.candidatNom} !`);
      setScheduleTarget(null);
      await loadCompanyData();
    } catch {
      toast.error('Erreur lors de la planification de l’entretien.');
    }
  };

  const handleUpdateInterviewStatus = async (id: number, statut: string) => {
    try {
      await api.patch(`/api/entretiens/${id}`, { statut });
      toast.success('Statut de l’entretien mis à jour.');
      await loadCompanyData();
    } catch {
      toast.error('Erreur lors de la modification.');
    }
  };

  const handleSaveCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/api/entreprises/me', {
        ...compForm,
        logoUrl: entreprise?.logoUrl,
      });
      await refreshProfile();
      toast.success('Profil entreprise mis à jour !');
    } catch {
      toast.error('Erreur lors de la sauvegarde.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await uploadDocumentOrLogo(file, 'logo');
      await refreshProfile();
      toast.success(`Logo "${res.fileName}" téléchargé avec succès !`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du téléchargement du logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSelectPresetLogo = async (logoUrl: string) => {
    try {
      await api.put('/api/entreprises/me', {
        ...compForm,
        logoUrl,
      });
      await refreshProfile();
      toast.success('Logo d’entreprise mis à jour en 1 clic !');
    } catch (err) {
      toast.error(err, 'Mise à jour du logo');
    }
  };

  const handleQuickFillOffer = () => {
    setOfferForm({
      titre: 'Lead Full Stack Architect — Java 21 / Spring Boot 3 & React 19',
      description:
        'Rejoignez notre squad Core Engineering pour concevoir et faire évoluer notre plateforme cloud SaaS haute performance utilisée par des milliers d’entreprises.',
      missions:
        '• Concevoir des microservices scalables avec Java 21, Spring Boot 3 et MySQL 8.\n• Développer des interfaces 3D interactives et fluides en React 19 et TypeScript.\n• Accompagner l’équipe sur les revues de code, la sécurité et l’architecture.',
      profilRecherche:
        '• Diplôme d’Ingénieur ou Master 2 en Informatique (3 à 6 ans d’expérience).\n• Maîtrise approfondie de Java/Spring Boot, React/TypeScript, SQL et Docker.\n• Esprit d’équipe, autonomie et passion pour l’excellence produit.',
      localisation: entreprise?.adresse || 'Paris, France (Hybride)',
      modeTravail: 'Hybride',
      categorie: 'Ingénierie & Tech',
      typeContrat: 'CDI',
      niveauExperience: 'Confirmé (3–5 ans)',
      competencesRequises: 'Java 21, Spring Boot 3, React 19, TypeScript, MySQL, Docker, REST API',
      salaire: '64000',
      salaireMax: '78000',
      statut: 'ACTIVE',
    });
    toast.success('Offre d’emploi pré-remplie en 1 clic ! Vous pouvez la publier directement.');
  };

  const tabs = [
    {
      id: 'overview',
      label: lang === 'ar' ? 'لوحة التحكم' : 'Tableau de bord',
      laIcon: 'la la-home',
    },
    {
      id: 'company-profile',
      label: lang === 'ar' ? 'ملف الشركة' : 'Profil de l’entreprise',
      laIcon: 'la la-user-tie',
    },
    {
      id: 'offers',
      label: lang === 'ar' ? 'إدارة عروضي' : 'Gérer mes offres',
      laIcon: 'la la-briefcase',
      badge: offres.length,
    },
    {
      id: 'applicants',
      label: lang === 'ar' ? 'الترشيحات والتقييمات' : 'Candidatures & Évaluations',
      laIcon: 'la la-file-invoice',
      badge: candidatures.length,
    },
    {
      id: 'tests',
      label: lang === 'ar' ? 'الاختبارات التقنية' : 'Tests Techniques QCM',
      laIcon: 'la la-laptop-code',
      badge: testsTechniques.length,
    },
    {
      id: 'interviews',
      label: lang === 'ar' ? 'مواعيد المقابلات' : 'Entretiens planifiés',
      laIcon: 'la la-calendar-check',
      badge: entretiens.length,
    },
  ];

  const filteredCandidatures = candidatures.filter((c) => {
    if (filterOfferId !== 'ALL' && String(c.offreId) !== filterOfferId) return false;
    if (filterAppStatus === 'EN_ATTENTE') {
      return c.statut === 'EN_ATTENTE' || c.statut === 'EN_COURS_EXAMEN';
    }
    if (filterAppStatus !== 'ALL' && c.statut !== filterAppStatus) return false;
    return true;
  });

  return (
    <DashboardLayout
      title={entreprise?.nomEntreprise || (lang === 'ar' ? 'فضاء مسؤولي التوظيف' : 'Espace Recruteur')}
      subtitle={entreprise?.secteur || (lang === 'ar' ? 'إدارة عروض العمل، طلبات الترشيح ومواعيد المقابلات' : 'Gérez vos offres d’emploi, candidatures et entretiens')}
      roleLabel={lang === 'ar' ? 'شركة' : 'ENTREPRISE'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        <button
          onClick={openNewOfferModal}
          className="theme-btn btn-style-one"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <i className="la la-plus" style={{ marginRight: '6px' }}></i>
          {lang === 'ar' ? 'نشر عرض عمل جديد' : 'Publier une nouvelle offre'}
        </button>
      }
    >
      {activeTab === 'overview' && (
        <>
          <div className="row">
            <KpiCard
              label={lang === 'ar' ? 'عروض العمل المنشورة' : 'Offres publiées'}
              value={offres.length}
              laIcon="la la-briefcase"
              accent="blue"
            />
            <KpiCard
              label={lang === 'ar' ? 'طلبات التوظيف الواردة' : 'Candidatures reçues'}
              value={candidatures.length}
              laIcon="la la-file-invoice"
              accent="red"
            />
            <KpiCard
              label={lang === 'ar' ? 'قيد المراجعة' : "En attente d'examen"}
              value={candidatures.filter((c) => c.statut === 'EN_ATTENTE').length}
              laIcon="la la-clock"
              accent="yellow"
            />
            <KpiCard
              label={lang === 'ar' ? 'المقابلات المحددة' : 'Entretiens programmés'}
              value={entretiens.filter((e) => e.statut === 'PLANIFIE').length}
              laIcon="la la-calendar-check"
              accent="green"
            />
          </div>

          <div className="row">
            <div className="col-xl-7 col-lg-12">
              <div className="graph-widget ls-widget">
                <div className="widget-title">
                  <h4>Performance des offres (Candidatures par poste)</h4>
                </div>
                <div className="widget-content" style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.offerPerformance || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ecedf2" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="candidatures" fill="#1967d2" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="col-xl-5 col-lg-12">
              <div className="notification-widget ls-widget">
                <div className="widget-title">
                  <h4>Dernières candidatures reçues</h4>
                  <button
                    onClick={() => setActiveTab('applicants')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1967d2',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Tout voir →
                  </button>
                </div>
                <div className="widget-content">
                  <ul className="notification-list">
                    {candidatures.slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <span className="icon la la-briefcase"></span>{' '}
                        <strong>{c.candidatNom}</strong> a postulé à{' '}
                        <span className="colored">{c.offreTitre}</span>
                        <div style={{ marginTop: '5px' }}>
                          <StatusBadge status={c.statut} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'offers' && (
        <div className="row">
          <div className="col-lg-12">
            <div className="ls-widget">
              <div className="tabs-box">
                <div className="widget-title">
                  <h4>Gestion de nos offres d’emploi ({offres.length})</h4>
                  <div className="chosen-outer">
                    <button
                      onClick={openNewOfferModal}
                      className="theme-btn btn-style-one"
                      style={{ padding: '10px 20px', border: 'none', cursor: 'pointer' }}
                    >
                      + Publier une offre
                    </button>
                  </div>
                </div>

                <div className="widget-content">
                  <div className="table-outer">
                    <table className="default-table manage-job-table">
                      <thead>
                        <tr>
                          <th>Titre du poste & Localisation</th>
                          <th>Candidatures</th>
                          <th>Contrat & Salaire</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offres.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <h6>{o.titre}</h6>
                              <span className="info">
                                <i className="icon la la-map-marker"></i> {o.localisation} (
                                {o.modeTravail || 'Hybride'}) · {o.categorie || 'Tech'}
                              </span>
                            </td>
                            <td className="applied">
                              <a
                                href="#applicants"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFilterOfferId(String(o.id));
                                  setActiveTab('applicants');
                                }}
                              >
                                {o.nombreCandidatures || 0} candidature(s)
                              </a>
                            </td>
                            <td>
                              {o.typeContrat} <br />
                              <small>{formatSalaryRange(o.salaire, o.salaireMax)}</small>
                            </td>
                            <td>
                              <StatusBadge status={o.statut} />
                            </td>
                            <td>
                              <div className="option-box">
                                <ul className="option-list">
                                  <li>
                                    <button
                                      onClick={() => openEditOfferModal(o)}
                                      data-text="Modifier l'offre"
                                      title="Modifier l'offre"
                                    >
                                      <span className="la la-pencil"></span>
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => handleDeleteOffer(o.id)}
                                      data-text="Supprimer l'offre"
                                      title="Supprimer l'offre"
                                    >
                                      <span className="la la-trash"></span>
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applicants' && (
        <div className="row">
          <div className="col-lg-12">
            <div className="ls-widget">
              <div className="tabs-box">
                <div className="widget-title">
                  <h4>Candidatures reçues & Consultation des CV PDF ({filteredCandidatures.length})</h4>
                  <div className="chosen-outer" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                      value={filterOfferId}
                      onChange={(e) => setFilterOfferId(e.target.value)}
                      className="chosen-select"
                      style={{
                        height: '42px',
                        padding: '0 14px',
                        background: '#f0f5f7',
                        borderRadius: '8px',
                        border: '1px solid #ecedf2',
                      }}
                    >
                      <option value="ALL">Toutes nos offres</option>
                      {offres.map((o) => (
                        <option key={o.id} value={String(o.id)}>
                          {o.titre}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterAppStatus}
                      onChange={(e) => setFilterAppStatus(e.target.value)}
                      className="chosen-select"
                      style={{
                        height: '42px',
                        padding: '0 14px',
                        background: '#f0f5f7',
                        borderRadius: '8px',
                        border: '1px solid #ecedf2',
                      }}
                    >
                      <option value="EN_ATTENTE">En attente de décision ({candidatures.filter((c) => c.statut === 'EN_ATTENTE' || c.statut === 'EN_COURS_EXAMEN').length})</option>
                      <option value="ACCEPTEE">Candidatures acceptées ({candidatures.filter((c) => c.statut === 'ACCEPTEE').length})</option>
                      <option value="REFUSEE">Candidatures refusées ({candidatures.filter((c) => c.statut === 'REFUSEE').length})</option>
                      <option value="ENTRETIEN">Entretien planifié ({candidatures.filter((c) => c.statut === 'ENTRETIEN').length})</option>
                      <option value="ALL">Toutes les candidatures ({candidatures.length})</option>
                    </select>
                  </div>
                </div>
                <div className="widget-content">
                  <div className="row">
                    {filteredCandidatures.map((c) => (
                      <div key={c.id} className="candidate-block-three col-lg-12 col-md-12 col-sm-12">
                        <div className="inner-box">
                          <div className="content">
                            <figure className="image">
                              <img src="/images/resource/candidate-6.png" alt={c.candidatNom} />
                            </figure>
                            <h4 className="name">
                              <a
                                href="#candidate-profile"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedCandidateProfile(c);
                                }}
                              >
                                {c.candidatNom}
                              </a>{' '}
                              <StatusBadge status={c.statut} />
                            </h4>
                            <ul className="candidate-info">
                              <li className="designation">{c.offreTitre}</li>
                              <li>
                                <span className="icon la la-envelope"></span> {c.candidatEmail}
                              </li>
                              {c.scoreMatching && (
                                <li style={{ color: '#1967d2', fontWeight: 600 }}>
                                  Compatibilité : {c.scoreMatching}%
                                </li>
                              )}
                              {evaluationsIA[c.id] && (
                                <li style={{ fontWeight: 700, color: '#059669' }}>
                                  ⭐ {lang === 'ar' ? 'تقييم الملف' : 'Note d’évaluation'} : {evaluationsIA[c.id].noteSur20}/20 ({evaluationsIA[c.id].recommandation})
                                </li>
                              )}
                            </ul>
                            {c.candidatCompetences && (
                              <ul className="post-tags" style={{ marginTop: '8px' }}>
                                {c.candidatCompetences
                                  .split(',')
                                  .slice(0, 6)
                                  .map((skill, idx) => (
                                    <li key={idx}>
                                      <a href="#!">{skill.trim()}</a>
                                    </li>
                                  ))}
                              </ul>
                            )}
                            {evaluationsIA[c.id]?.synthese && (
                              <div
                                style={{
                                  background: 'linear-gradient(135deg, #f0fdf4, #eff6ff)',
                                  border: '1px solid #bbf7d0',
                                  borderRadius: '8px',
                                  padding: '10px 14px',
                                  marginTop: '10px',
                                  fontSize: '13px',
                                  color: '#166534',
                                }}
                              >
                                <strong>📋 {lang === 'ar' ? 'تحليل التقييم :' : 'Synthèse d’évaluation :'}</strong> {evaluationsIA[c.id].synthese}
                              </div>
                            )}
                            {c.lettreMotivation && (
                              <p style={{ fontSize: '13px', color: '#696969', marginTop: '10px', marginBottom: 0 }}>
                                <strong>Motivation :</strong> {c.lettreMotivation}
                              </p>
                            )}
                          </div>

                          <div className="option-box">
                            <ul className="option-list">
                              <li>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEvaluationModal(c)}
                                  data-text={lang === 'ar' ? 'تقييم الملف' : 'Évaluation du dossier'}
                                  title={lang === 'ar' ? 'عرض التقييم المفصل للملف' : "Consulter l'évaluation détaillée du dossier"}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '30px',
                                    height: '30px',
                                    background: '#e0e7ff',
                                    color: '#4338ca',
                                    borderRadius: '8px',
                                  }}
                                >
                                  <span className="la la-brain"></span>
                                </button>
                              </li>
                              {c.candidatCvUrl && (
                                <li>
                                  <a
                                    href={c.candidatCvUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    data-text="Télécharger / Voir CV PDF"
                                    title="Consulter le CV PDF"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '30px',
                                      height: '30px',
                                      background: 'rgba(25, 103, 210, 0.07)',
                                      color: '#1967d2',
                                      borderRadius: '8px',
                                    }}
                                  >
                                    <span className="la la-download"></span>
                                  </a>
                                </li>
                              )}
                              {c.statut !== 'ACCEPTEE' && c.statut !== 'REFUSEE' ? (
                                <>
                                  <li>
                                    <button
                                      onClick={() => setScheduleTarget(c)}
                                      data-text="Planifier un entretien"
                                      title="Planifier un entretien"
                                    >
                                      <span className="la la-calendar-plus"></span>
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() =>
                                        handleUpdateCandidatureStatus(
                                          c.id,
                                          'EN_COURS_EXAMEN',
                                          'Votre profil est actuellement étudié par notre équipe technique.'
                                        )
                                      }
                                      data-text="Marquer en cours d'examen"
                                      title="Marquer en cours d'examen"
                                    >
                                      <span className="la la-eye"></span>
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() =>
                                        handleUpdateCandidatureStatus(
                                          c.id,
                                          'ACCEPTEE',
                                          'Candidature retenue par notre équipe de recrutement.'
                                        )
                                      }
                                      data-text="Accepter la candidature"
                                      title="Accepter la candidature"
                                    >
                                      <span className="la la-check"></span>
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() =>
                                        handleUpdateCandidatureStatus(
                                          c.id,
                                          'REFUSEE',
                                          'Nous avons retenu un autre profil pour ce poste.'
                                        )
                                      }
                                      data-text="Refuser la candidature"
                                      title="Refuser la candidature"
                                    >
                                      <span className="la la-times-circle"></span>
                                    </button>
                                  </li>
                                </>
                              ) : (
                                <li style={{ marginRight: '8px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 12px',
                                      borderRadius: '20px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      background: c.statut === 'ACCEPTEE' ? '#ecfdf5' : '#fef2f2',
                                      color: c.statut === 'ACCEPTEE' ? '#059669' : '#dc2626',
                                      border: `1px solid ${c.statut === 'ACCEPTEE' ? '#a7f3d0' : '#fecaca'}`,
                                    }}
                                  >
                                    <i className={c.statut === 'ACCEPTEE' ? 'la la-check-circle' : 'la la-times-circle'}></i>
                                    {c.statut === 'ACCEPTEE' ? 'Candidature acceptée' : 'Candidature refusée'}
                                  </span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Tests Techniques QCM & Studio Agent IA */}
      {activeTab === 'tests' && (
        <div className="row">
          <div className="col-lg-12">
            <div className="ls-widget">
              <div className="tabs-box">
                <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Tests Techniques & Évaluations QCM ({testsTechniques.length})</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                      Concevez, dialoguez avec l'agent IA, vérifiez et publiez vos tests QCM avant mise à disposition des candidats.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (offres.length === 0) {
                          toast.warning('Veuillez d’abord publier une offre d’emploi pour lui rattacher un test technique.');
                          return;
                        }
                        openTestStudio(undefined, offres[0]);
                      }}
                      className="theme-btn btn-style-one"
                      style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <i className="la la-magic"></i>
                      ⚡ Studio Agent IA & Nouveau Test
                    </button>
                  </div>
                </div>

                <div className="widget-content">
                  {testsTechniques.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>🤖</div>
                      <h5 style={{ fontWeight: 700, color: '#0f172a' }}>Aucun test technique n’est encore configuré</h5>
                      <p style={{ color: '#64748b', maxWidth: '520px', margin: '6px auto 16px', fontSize: '14px' }}>
                        Utilisez l’Agent IA pour générer automatiquement un QCM adapté aux compétences de vos offres d’emploi. Vous pourrez réviser chaque question avant de la publier.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (offres.length > 0) {
                            openTestStudio(undefined, offres[0]);
                          } else {
                            openNewOfferModal();
                          }
                        }}
                        className="theme-btn btn-style-one"
                        style={{ padding: '10px 22px' }}
                      >
                        ⚡ Ouvrir le Studio IA de Test
                      </button>
                    </div>
                  ) : (
                    <div className="table-outer">
                      <table className="default-table manage-job-table">
                        <thead>
                          <tr>
                            <th>Titre du Test</th>
                            <th>Offre d’emploi</th>
                            <th>Questions</th>
                            <th>Durée & Seuil</th>
                            <th>Statut</th>
                            <th>Passages</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testsTechniques.map((t) => {
                            const isPublie = t.publie ?? (t.statut === 'PUBLIE');
                            return (
                              <tr key={t.id}>
                                <td>
                                  <h6 style={{ fontWeight: 700, margin: 0 }}>{t.titre}</h6>
                                  <span className="info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                                    {t.genereParIa ? '✨ Généré par Agent IA' : 'Manuel'}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.offreTitre}</span>
                                </td>
                                <td>
                                  <span style={{ fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '3px 8px', borderRadius: '8px', fontSize: '13px' }}>
                                    {t.questions?.length || 0} questions
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontSize: '13px', color: '#475569' }}>
                                    ⏱️ {t.dureeMinutes} min · Seuil : <strong>{t.scoreMinimum}%</strong>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 10px',
                                      borderRadius: '16px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      background: isPublie ? '#dcfce7' : '#fef3c7',
                                      color: isPublie ? '#15803d' : '#b45309',
                                      border: `1px solid ${isPublie ? '#86efac' : '#fde68a'}`,
                                    }}
                                  >
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublie ? '#16a34a' : '#d97706' }}></span>
                                    {isPublie ? 'PUBLIÉ' : 'BROUILLON'}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '13px' }}>
                                    {t.nombrePassages || 0} candidat(s)
                                  </span>
                                </td>
                                <td style={{ fontSize: '13px', color: '#64748b' }}>
                                  {new Date(t.dateCreation).toLocaleDateString('fr-FR')}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => openTestStudio(t)}
                                      title="Vérifier et modifier les questions dans le Studio IA"
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#334155',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      ✏️ Vérifier & Modifier
                                    </button>
                                    {!isPublie && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickPublishTest(t.id)}
                                        title="Valider et publier le test pour les candidats"
                                        style={{
                                          padding: '6px 12px',
                                          borderRadius: '8px',
                                          border: 'none',
                                          background: 'linear-gradient(135deg, #10b981, #059669)',
                                          color: '#ffffff',
                                          fontSize: '12px',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}
                                      >
                                        🚀 Publier
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Tableau des passages de tests par les candidats */}
                  {passagesTests.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h5 style={{ fontWeight: 800, margin: 0, color: '#0f172a' }}>
                            📊 Réponses & Résultats des Candidats aux Tests QCM ({passagesTests.length})
                          </h5>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                            Consultez les réponses détaillées choisies par chaque candidat par rapport aux bonnes réponses.
                          </p>
                        </div>
                      </div>
                      <div className="table-outer">
                        <table className="default-table manage-job-table">
                          <thead>
                            <tr>
                              <th>Candidat</th>
                              <th>Test & Offre</th>
                              <th>Score Obtenu</th>
                              <th>Résultat</th>
                              <th>Date de passage</th>
                              <th style={{ textAlign: 'right' }}>Détails</th>
                            </tr>
                          </thead>
                          <tbody>
                            {passagesTests.map((pt) => (
                              <tr key={pt.id}>
                                <td>
                                  <h6 style={{ margin: 0, fontWeight: 700 }}>{pt.candidatNom}</h6>
                                  <span className="info" style={{ color: '#64748b', fontSize: '13px' }}>{pt.candidatEmail}</span>
                                </td>
                                <td>
                                  <h6 style={{ margin: 0, fontWeight: 600 }}>{pt.testTitre}</h6>
                                  <span className="info" style={{ color: '#2563eb', fontSize: '12px' }}>{pt.offreTitre}</span>
                                </td>
                                <td>
                                  <strong style={{ fontSize: '15px', color: pt.reussi ? '#059669' : '#dc2626' }}>
                                    {pt.score}% ({pt.bonnesReponses}/{pt.totalQuestions})
                                  </strong>
                                </td>
                                <td>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    background: pt.reussi ? '#dcfce7' : '#fee2e2',
                                    color: pt.reussi ? '#15803d' : '#b91c1c',
                                  }}>
                                    {pt.reussi ? '✓ VALIDÉ' : '✗ ÉCHOUÉ'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '13px', color: '#64748b' }}>
                                  {new Date(pt.datePassage).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleViewPassageDetail(pt.id)}
                                    disabled={loadingPassageDetail === pt.id}
                                    style={{
                                      padding: '7px 14px',
                                      borderRadius: '8px',
                                      border: '1px solid #6366f1',
                                      background: '#eef2ff',
                                      color: '#4338ca',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: loadingPassageDetail === pt.id ? 'not-allowed' : 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                    }}
                                  >
                                    👁️ {loadingPassageDetail === pt.id ? 'Chargement...' : 'Voir les réponses du candidat'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="row">
          <div className="col-lg-12">
            <div className="ls-widget">
              <div className="tabs-box">
                <div className="widget-title">
                  <h4>Agenda des entretiens de recrutement ({entretiens.length})</h4>
                </div>
                <div className="widget-content">
                  <div className="table-outer">
                    <table className="default-table manage-job-table">
                      <thead>
                        <tr>
                          <th>Candidat & Poste</th>
                          <th>Date & Horaire</th>
                          <th>Modalité & Lien Visio</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entretiens.map((ent) => (
                          <tr key={ent.id}>
                            <td>
                              <h6>{ent.candidatNom}</h6>
                              <span className="info">{ent.offreTitre}</span>
                            </td>
                            <td>
                              {new Date(ent.dateEntretien).toLocaleString('fr-FR', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td>
                              <strong>{ent.typeEntretien || 'Visioconférence'}</strong>
                              <div style={{ marginTop: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setActiveVisioEntretien(ent)}
                                  className="theme-btn btn-style-one"
                                  style={{ padding: '4px 12px', fontSize: '11px', border: 'none', cursor: 'pointer' }}
                                >
                                  <i className="la la-video" style={{ marginRight: '4px' }}></i>
                                  {lang === 'ar' ? 'الانضمام للمقابلة' : 'Rejoindre la visio'}
                                </button>
                              </div>
                              {ent.commentaire && (
                                <div style={{ fontSize: '12px', color: '#696969', marginTop: '4px' }}>
                                  {ent.commentaire}
                                </div>
                              )}
                            </td>
                            <td>
                              <StatusBadge status={ent.statut} />
                            </td>
                            <td>
                              <div className="option-box">
                                <ul className="option-list">
                                  <li>
                                    <button
                                      onClick={() => handleUpdateInterviewStatus(ent.id, 'TERMINE')}
                                      data-text="Marquer comme terminé"
                                      title="Marquer comme terminé"
                                    >
                                      <span className="la la-check"></span>
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => handleUpdateInterviewStatus(ent.id, 'ANNULE')}
                                      data-text="Annuler l'entretien"
                                      title="Annuler l'entretien"
                                    >
                                      <span className="la la-times-circle"></span>
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'company-profile' && (
        <div className="row">
          <div className="col-lg-12">
            <div className="ls-widget">
              <div className="tabs-box">
                <div className="widget-title">
                  <h4>Profil de l’entreprise & Logo Officiel</h4>
                </div>

                <div className="widget-content">
                  <div
                    className="uploading-outer"
                    style={{
                      alignItems: 'center',
                      gap: '20px',
                      flexWrap: 'wrap',
                      background: '#f8fafc',
                      padding: '20px',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <img
                      src={entreprise?.logoUrl || '/images/resource/company-1.png'}
                      alt={entreprise?.nomEntreprise || 'Logo'}
                      style={{
                        width: '84px',
                        height: '84px',
                        objectFit: 'contain',
                        borderRadius: '14px',
                        border: '2px solid #6366f1',
                        padding: '8px',
                        background: '#ffffff',
                      }}
                    />
                    <div className="uploadButton">
                      <input
                        className="uploadButton-input"
                        type="file"
                        accept="image/*"
                        id="upload-logo"
                        onChange={handleLogoUpload}
                      />
                      <label className="uploadButton-button ripple-effect" htmlFor="upload-logo">
                        {uploadingLogo ? 'Téléchargement...' : 'Télécharger un logo personnalisé'}
                      </label>
                      <span className="uploadButton-file-name"></span>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                        ⚡ Ou choisir un logo HD intégré en 1 clic :
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                          '/images/resource/company-1.png',
                          '/images/resource/company-2.png',
                          '/images/resource/company-3.png',
                          '/images/resource/company-4.png',
                          '/images/resource/company-5.png',
                          '/images/resource/company-6.png',
                        ].map((logoUrl, idx) => (
                          <button
                            key={logoUrl}
                            type="button"
                            onClick={() => handleSelectPresetLogo(logoUrl)}
                            title={`Appliquer le logo #${idx + 1}`}
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '10px',
                              border:
                                entreprise?.logoUrl === logoUrl
                                  ? '2px solid #4f46e5'
                                  : '1px solid #cbd5e1',
                              background: '#ffffff',
                              padding: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            <img
                              src={logoUrl}
                              alt={`Logo ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveCompanyProfile} className="default-form">
                    <div className="row">
                      <div className="form-group col-lg-6 col-md-12">
                        <label>Nom de l’entreprise *</label>
                        <input
                          type="text"
                          required
                          value={compForm.nomEntreprise}
                          onChange={(e) =>
                            setCompForm({ ...compForm, nomEntreprise: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-group col-lg-6 col-md-12">
                        <label>Secteur d’activité</label>
                        <input
                          type="text"
                          value={compForm.secteur}
                          onChange={(e) => setCompForm({ ...compForm, secteur: e.target.value })}
                        />
                      </div>

                      <div className="form-group col-lg-6 col-md-12">
                        <label>Adresse du siège</label>
                        <input
                          type="text"
                          value={compForm.adresse}
                          onChange={(e) => setCompForm({ ...compForm, adresse: e.target.value })}
                        />
                      </div>

                      <div className="form-group col-lg-6 col-md-12">
                        <label>Site Web</label>
                        <input
                          type="text"
                          value={compForm.siteWeb}
                          onChange={(e) => setCompForm({ ...compForm, siteWeb: e.target.value })}
                        />
                      </div>

                      <div className="form-group col-lg-6 col-md-12">
                        <label>Taille de l’entreprise</label>
                        <input
                          type="text"
                          value={compForm.tailleEntreprise}
                          onChange={(e) =>
                            setCompForm({ ...compForm, tailleEntreprise: e.target.value })
                          }
                          placeholder="Ex: 50 - 200 collaborateurs"
                        />
                      </div>

                      <div className="form-group col-lg-6 col-md-12">
                        <label>Téléphone recruteur</label>
                        <input
                          type="text"
                          value={compForm.telephone}
                          onChange={(e) => setCompForm({ ...compForm, telephone: e.target.value })}
                        />
                      </div>

                      <div className="form-group col-lg-12 col-md-12">
                        <label>Présentation de l’entreprise</label>
                        <textarea
                          rows={4}
                          value={compForm.description}
                          onChange={(e) =>
                            setCompForm({ ...compForm, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="form-group col-lg-12 col-md-12">
                        <button type="submit" className="theme-btn btn-style-one">
                          Enregistrer le profil entreprise
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Offer */}
      {showOfferModal && (
        <div className="superio-modal-backdrop">
          <div className="superio-modal-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <h4 style={{ margin: 0, fontWeight: 700 }}>
                {editingOffer ? 'Modifier l’offre d’emploi' : 'Publier une nouvelle offre d’emploi'}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!editingOffer && (
                  <button
                    type="button"
                    onClick={handleQuickFillOffer}
                    className="theme-btn btn-style-three"
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    ⚡ Pré-remplir une offre complète (1 clic)
                  </button>
                )}
                <button
                  onClick={() => setShowOfferModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveOffer} className="default-form">
              <div className="row">
                <div className="form-group col-lg-6 col-md-12">
                  <label>Titre du poste *</label>
                  <input
                    type="text"
                    required
                    value={offerForm.titre}
                    onChange={(e) => setOfferForm({ ...offerForm, titre: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Localisation *</label>
                  <input
                    type="text"
                    required
                    value={offerForm.localisation}
                    onChange={(e) => setOfferForm({ ...offerForm, localisation: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-4 col-md-12">
                  <label>Type de contrat</label>
                  <select
                    value={offerForm.typeContrat}
                    onChange={(e) => setOfferForm({ ...offerForm, typeContrat: e.target.value })}
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Alternance">Alternance</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div className="form-group col-lg-4 col-md-12">
                  <label>Mode de travail</label>
                  <select
                    value={offerForm.modeTravail}
                    onChange={(e) => setOfferForm({ ...offerForm, modeTravail: e.target.value })}
                  >
                    <option value="Hybride">Hybride</option>
                    <option value="Télétravail">Télétravail</option>
                    <option value="Présentiel">Présentiel</option>
                  </select>
                </div>
                <div className="form-group col-lg-4 col-md-12">
                  <label>Catégorie</label>
                  <select
                    value={offerForm.categorie}
                    onChange={(e) => setOfferForm({ ...offerForm, categorie: e.target.value })}
                  >
                    <option value="Ingénierie & Tech">Ingénierie & Tech</option>
                    <option value="Data & IA">Data & IA</option>
                    <option value="Design & Produit">Design & Produit</option>
                  </select>
                </div>
                <div className="form-group col-lg-4 col-md-12">
                  <label>Salaire min (€/an)</label>
                  <input
                    type="number"
                    value={offerForm.salaire}
                    onChange={(e) => setOfferForm({ ...offerForm, salaire: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-4 col-md-12">
                  <label>Salaire max (€/an)</label>
                  <input
                    type="number"
                    value={offerForm.salaireMax}
                    onChange={(e) => setOfferForm({ ...offerForm, salaireMax: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-4 col-md-12">
                  <label>Statut de l’offre</label>
                  <select
                    value={offerForm.statut}
                    onChange={(e) => setOfferForm({ ...offerForm, statut: e.target.value })}
                  >
                    <option value="ACTIVE">Active (Publiée)</option>
                    <option value="FERMEE">Clôturée</option>
                    <option value="BROUILLON">Brouillon</option>
                  </select>
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Compétences requises (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={offerForm.competencesRequises}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, competencesRequises: e.target.value })
                    }
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12">
                  <label>Description du poste *</label>
                  <textarea
                    rows={3}
                    required
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Responsabilités & Missions</label>
                  <textarea
                    rows={3}
                    value={offerForm.missions}
                    onChange={(e) => setOfferForm({ ...offerForm, missions: e.target.value })}
                  />
                </div>
                <div className="form-group col-lg-6 col-md-12">
                  <label>Profil recherché</label>
                  <textarea
                    rows={3}
                    value={offerForm.profilRecherche}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, profilRecherche: e.target.value })
                    }
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(false)}
                    className="theme-btn btn-style-three"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="theme-btn btn-style-one">
                    {editingOffer ? 'Enregistrer les modifications' : 'Publier l’offre'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Interview */}
      {scheduleTarget && (
        <div className="superio-modal-backdrop">
          <div className="superio-modal-card" style={{ maxWidth: '550px' }}>
            <h4 style={{ marginBottom: '5px', fontWeight: 600 }}>Planifier un entretien</h4>
            <p style={{ fontSize: '14px', color: '#696969', marginBottom: '20px' }}>
              Candidat : <strong>{scheduleTarget.candidatNom}</strong> ({scheduleTarget.offreTitre})
            </p>

            <form onSubmit={handleScheduleInterview} className="default-form">
              <div className="form-group">
                <label>Date et heure de l’entretien *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.dateEntretien}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, dateEntretien: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Modalité / Type d’entretien</label>
                <input
                  type="text"
                  value={interviewForm.typeEntretien}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, typeEntretien: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Lien de visioconférence ou adresse</label>
                <input
                  type="text"
                  value={interviewForm.lienOuLieu}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, lienOuLieu: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Commentaire / Instructions</label>
                <textarea
                  rows={3}
                  value={interviewForm.commentaire}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, commentaire: e.target.value })
                  }
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setScheduleTarget(null)}
                  className="theme-btn btn-style-three"
                >
                  Annuler
                </button>
                <button type="submit" className="theme-btn btn-style-one">
                  Confirmer l’entretien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Candidate Profile Visualization */}
      {selectedCandidateProfile && (
        <div className="superio-modal-backdrop" onClick={() => setSelectedCandidateProfile(null)}>
          <div className="superio-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>{selectedCandidateProfile.candidatNom}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#2563eb', fontWeight: 600 }}>
                  {selectedCandidateProfile.candidatTitre || 'Ingénieur Logiciel'} · Score Matching : {selectedCandidateProfile.scoreMatching || 88}%
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidateProfile(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
              <div>
                <small style={{ color: '#64748b' }}>Email</small>
                <div style={{ fontWeight: 600 }}>{selectedCandidateProfile.candidatEmail}</div>
              </div>
              <div>
                <small style={{ color: '#64748b' }}>Téléphone</small>
                <div style={{ fontWeight: 600 }}>{selectedCandidateProfile.candidatTelephone || 'Non renseigné'}</div>
              </div>
              <div>
                <small style={{ color: '#64748b' }}>Offre postulée</small>
                <div style={{ fontWeight: 600 }}>{selectedCandidateProfile.offreTitre}</div>
              </div>
              <div>
                <small style={{ color: '#64748b' }}>Statut actuel</small>
                <div><StatusBadge status={selectedCandidateProfile.statut} /></div>
              </div>
            </div>

            {selectedCandidateProfile.candidatCompetences && (
              <div style={{ marginBottom: '16px' }}>
                <h6 style={{ fontWeight: 600, marginBottom: '6px' }}>Compétences techniques</h6>
                <p style={{ fontSize: '14px', margin: 0 }}>{selectedCandidateProfile.candidatCompetences}</p>
              </div>
            )}

            {selectedCandidateProfile.candidatExperience && (
              <div style={{ marginBottom: '16px' }}>
                <h6 style={{ fontWeight: 600, marginBottom: '6px' }}>Expérience professionnelle</h6>
                <p style={{ fontSize: '14px', margin: 0 }}>{selectedCandidateProfile.candidatExperience}</p>
              </div>
            )}

            {selectedCandidateProfile.candidatFormation && (
              <div style={{ marginBottom: '16px' }}>
                <h6 style={{ fontWeight: 600, marginBottom: '6px' }}>Formation</h6>
                <p style={{ fontSize: '14px', margin: 0 }}>{selectedCandidateProfile.candidatFormation}</p>
              </div>
            )}

            {selectedCandidateProfile.lettreMotivation && (
              <div style={{ marginBottom: '16px' }}>
                <h6 style={{ fontWeight: 600, marginBottom: '6px' }}>Lettre de motivation</h6>
                <p style={{ fontSize: '14px', margin: 0, whiteSpace: 'pre-line' }}>{selectedCandidateProfile.lettreMotivation}</p>
              </div>
            )}

            {(selectedCandidateProfile.cvUrlSpecifique || selectedCandidateProfile.candidatCvUrl) && (
              <div
                style={{
                  marginBottom: '20px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                }}
              >
                <div
                  style={{
                    background: '#1e293b',
                    color: '#f8fafc',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>📄 Aperçu direct du CV PDF ({selectedCandidateProfile.candidatNom})</span>
                  <a
                    href={selectedCandidateProfile.cvUrlSpecifique || selectedCandidateProfile.candidatCvUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#93c5fd', textDecoration: 'underline' }}
                  >
                    Ouvrir en plein écran ↗
                  </a>
                </div>
                <iframe
                  src={selectedCandidateProfile.cvUrlSpecifique || selectedCandidateProfile.candidatCvUrl || ''}
                  title="Aperçu CV Candidat"
                  style={{ width: '100%', height: '300px', border: 'none', background: '#fff' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              {(selectedCandidateProfile.cvUrlSpecifique || selectedCandidateProfile.candidatCvUrl) && (
                <a
                  href={selectedCandidateProfile.cvUrlSpecifique || selectedCandidateProfile.candidatCvUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="theme-btn btn-style-three"
                >
                  <i className="la la-file-pdf" style={{ marginRight: '6px' }}></i>
                  Ouvrir le CV PDF
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  const target = selectedCandidateProfile;
                  setSelectedCandidateProfile(null);
                  setScheduleTarget(target);
                }}
                className="theme-btn btn-style-one"
              >
                <i className="la la-calendar-plus" style={{ marginRight: '6px' }}></i>
                Planifier un entretien
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ÉVALUATION IA & DÉCISION DU RECRUTEUR */}
      {/* ========================================================================= */}
      {selectedEvaluation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setSelectedEvaluation(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              padding: '32px',
              position: 'relative',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                  ⚡ {lang === 'ar' ? 'تقييم دقيق ودرجة الملف' : 'ÉVALUATION DU DOSSIER & SCORE'}
                </span>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedEvaluation.candidatNom}
                </h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                  Candidature pour le poste : <strong>{selectedEvaluation.offreTitre}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvaluation(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* Score & Recommandation Hero Banner */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              {/* Note sur 20 */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8fafc, #ede9fe)',
                  border: '2px solid #c7d2fe',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Note Globale IA
                </div>
                <div style={{ fontSize: '46px', fontWeight: 900, color: '#312e81', lineHeight: 1.1, margin: '8px 0 4px' }}>
                  {selectedEvaluation.noteSur20}
                  <span style={{ fontSize: '20px', fontWeight: 600, color: '#6366f1' }}> / 20</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                  Indice de matching : <strong>{selectedEvaluation.scoreGlobal}%</strong>
                </div>
              </div>

              {/* Recommandation IA */}
              <div
                style={{
                  background:
                    selectedEvaluation.recommandation === 'ACCEPTER'
                      ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
                      : selectedEvaluation.recommandation === 'ENTRETIEN'
                      ? 'linear-gradient(135deg, #eff6ff, #dbeafe)'
                      : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                  border: `2px solid ${
                    selectedEvaluation.recommandation === 'ACCEPTER'
                      ? '#6ee7b7'
                      : selectedEvaluation.recommandation === 'ENTRETIEN'
                      ? '#93c5fd'
                      : '#fca5a5'
                  }`,
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: selectedEvaluation.recommandation === 'ACCEPTER' ? '#065f46' : selectedEvaluation.recommandation === 'ENTRETIEN' ? '#1e40af' : '#991b1b' }}>
                  Recommandation Algorithmique
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, margin: '8px 0 4px', color: selectedEvaluation.recommandation === 'ACCEPTER' ? '#047857' : selectedEvaluation.recommandation === 'ENTRETIEN' ? '#1d4ed8' : '#b91c1c' }}>
                  {selectedEvaluation.recommandation === 'ACCEPTER'
                    ? '✓ ACCEPTER / EMBAUCHE'
                    : selectedEvaluation.recommandation === 'ENTRETIEN'
                    ? '📅 CONVOQUER ENTRETIEN'
                    : '✗ NON RETENU'}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                  Niveau de confiance IA : {selectedEvaluation.niveauConfiance}%
                </div>
              </div>

              {/* Test QCM Score si passé */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Test Technique QCM
                </div>
                <div style={{ fontSize: '30px', fontWeight: 800, color: selectedEvaluation.scoreTest != null ? '#059669' : '#94a3b8', margin: '8px 0 4px' }}>
                  {selectedEvaluation.scoreTest != null ? `${selectedEvaluation.scoreTest}%` : 'En attente'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedEvaluation.scoreTest != null
                    ? (selectedEvaluation.scoreTest >= 60 ? '✓ Test réussi avec succès' : 'Score en deçà du seuil')
                    : 'Pas encore complété par le candidat'}
                </div>
              </div>
            </div>

            {/* Synthèse IA */}
            {selectedEvaluation.synthese && (
              <div style={{ background: '#f8fafc', borderLeft: '4px solid #6366f1', padding: '14px 18px', borderRadius: '0 12px 12px 0', marginBottom: '20px', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                <strong>Synthèse de l’algorithme : </strong> {selectedEvaluation.synthese}
              </div>
            )}

            {/* Détail des sous-scores */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                📊 Grille d’évaluation multi-critères
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Compétences Requises', val: selectedEvaluation.scoreCompetences, color: '#3b82f6' },
                  { label: 'Expérience & Séniorité', val: selectedEvaluation.scoreExperience, color: '#10b981' },
                  { label: 'Formation & Diplômes', val: selectedEvaluation.scoreFormation, color: '#8b5cf6' },
                  { label: 'Motivation & Dossier', val: selectedEvaluation.scoreMotivation, color: '#f59e0b' },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      <span style={{ color: '#475569' }}>{item.label}</span>
                      <strong style={{ color: item.color }}>{item.val}%</strong>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.val}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compétences détectées */}
            {selectedEvaluation.competencesTrouvees && selectedEvaluation.competencesTrouvees.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669', display: 'block', marginBottom: '8px' }}>
                  ✓ Compétences validées dans le profil :
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedEvaluation.competencesTrouvees.map((c, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 600 }}>
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Points Forts & Recommandations */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {selectedEvaluation.pointsForts && selectedEvaluation.pointsForts.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px' }}>
                  <strong style={{ color: '#166534', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    🌟 Points forts clés :
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#14532d', lineHeight: 1.6 }}>
                    {selectedEvaluation.pointsForts.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedEvaluation.pointsAmelioration && selectedEvaluation.pointsAmelioration.length > 0 && (
                <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '14px' }}>
                  <strong style={{ color: '#854d0e', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    💡 Recommandations pour l'échange :
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#713f12', lineHeight: 1.6 }}>
                    {selectedEvaluation.pointsAmelioration.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Décision Actuelle si déjà validée */}
            {selectedEvaluation.decisionRecruteur && (
              <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Décision déjà enregistrée :
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  Statut : <span style={{ color: selectedEvaluation.decisionRecruteur === 'ACCEPTEE' ? '#059669' : selectedEvaluation.decisionRecruteur === 'ENTRETIEN' ? '#2563eb' : '#dc2626' }}>
                    {selectedEvaluation.decisionRecruteur}
                  </span>
                </div>
                {selectedEvaluation.commentaireRecruteur && (
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
                    « {selectedEvaluation.commentaireRecruteur} »
                  </p>
                )}
              </div>
            )}

            {/* Section Validation de Décision */}
            <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                ✍️ Commentaire / Remarques du recruteur :
              </label>
              <textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="Indiquez ici vos notes de cadrage, feedback technique ou instructions pour le candidat..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={validatingDecision}
                  onClick={() => handleValiderDecision(selectedEvaluation.candidatureId, 'REFUSEE')}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: '1px solid #fca5a5',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    fontWeight: 700,
                    cursor: validatingDecision ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ❌ Refuser
                </button>

                <button
                  type="button"
                  disabled={validatingDecision}
                  onClick={() => handleValiderDecision(selectedEvaluation.candidatureId, 'ENTRETIEN')}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: validatingDecision ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  📅 Convoquer à un entretien
                </button>

                <button
                  type="button"
                  disabled={validatingDecision}
                  onClick={() => handleValiderDecision(selectedEvaluation.candidatureId, 'ACCEPTEE')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: validatingDecision ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  ✅ Valider & Accepter la candidature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CRÉATION TEST TECHNIQUE IA */}
      {/* ========================================================================= */}
      {showCreateTestModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setShowCreateTestModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              padding: '32px',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>
                  🤖 Intelligence Artificielle
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  Créer un Test Technique QCM
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTestModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTestIa}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Offre d'emploi associée :
                </label>
                <select
                  value={targetOfferForTest?.id || ''}
                  onChange={(e) => {
                    const sel = offres.find((o) => o.id === Number(e.target.value));
                    setTargetOfferForTest(sel || null);
                    if (sel) {
                      setTestForm((prev) => ({
                        ...prev,
                        titre: `Test Technique IA - ${sel.titre}`,
                        competencesCibles: sel.competencesRequises || '',
                      }));
                    }
                  }}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Sélectionnez une offre...</option>
                  {offres.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.titre} ({o.localisation})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Titre du test QCM :
                </label>
                <input
                  type="text"
                  value={testForm.titre}
                  onChange={(e) => setTestForm({ ...testForm, titre: e.target.value })}
                  placeholder="Ex: Évaluation Senior React & Spring Boot"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Durée (minutes) :
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={testForm.dureeMinutes}
                    onChange={(e) => setTestForm({ ...testForm, dureeMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Score minimum requis (%) :
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="100"
                    value={testForm.scoreMinimum}
                    onChange={(e) => setTestForm({ ...testForm, scoreMinimum: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Compétences à cibler par l'IA :
                </label>
                <input
                  type="text"
                  value={testForm.competencesCibles}
                  onChange={(e) => setTestForm({ ...testForm, competencesCibles: e.target.value })}
                  placeholder="Ex: Java 21, Spring Boot, React, PostgreSQL"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  L'IA génère automatiquement 5 questions à choix multiples adaptées à ces technologies avec explications didactiques.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTestModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingTest || !targetOfferForTest}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: (creatingTest || !targetOfferForTest) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {creatingTest ? 'Génération du test en cours...' : '⚡ Générer et Activer le Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : STUDIO AGENT IA & VÉRIFICATEUR DE TEST TECHNIQUE */}
      {/* ========================================================================= */}
      {studioOpen && (
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
          onClick={() => setStudioOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: studioView === 'split' ? '1280px' : '960px',
              width: '100%',
              height: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              transition: 'max-width 0.25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du Studio avec Bascule Chat / Test et Bouton Publier */}
            <div
              style={{
                padding: '14px 22px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    borderRadius: '12px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  🤖
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Studio de Test Technique
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                      Agent IA OpenRouter
                    </span>
                    <span>•</span>
                    <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Offre : <strong>{studioOffre?.titre || 'Poste'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* BARRE DE BASCULE : CHAT IA <-> TEST QCM <-> CÔTE À CÔTE */}
              <div
                style={{
                  display: 'flex',
                  background: '#e2e8f0',
                  padding: '4px',
                  borderRadius: '12px',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setStudioView('chat')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: studioView === 'chat' ? '#ffffff' : 'transparent',
                    color: studioView === 'chat' ? '#4f46e5' : '#64748b',
                    fontWeight: studioView === 'chat' ? 800 : 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: studioView === 'chat' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>💬</span> Boîte de Chat IA
                </button>

                <button
                  type="button"
                  onClick={() => setStudioView('test')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: studioView === 'test' ? '#ffffff' : 'transparent',
                    color: studioView === 'test' ? '#4f46e5' : '#64748b',
                    fontWeight: studioView === 'test' ? 800 : 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: studioView === 'test' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>📝</span> Boîte de Test ({studioQuestions.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStudioView('split')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: studioView === 'split' ? '#ffffff' : 'transparent',
                    color: studioView === 'split' ? '#4f46e5' : '#64748b',
                    fontWeight: studioView === 'split' ? 800 : 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: studioView === 'split' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>⚡</span> Côte à Côte
                </button>
              </div>

              {/* BOUTONS D'ACTION RAPIDE EN EN-TÊTE DONT LE BOUTON PUBLIER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  disabled={savingStudioTest || studioQuestions.length === 0}
                  onClick={() => handleSaveStudioTest(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 700,
                    cursor: savingStudioTest || studioQuestions.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                  }}
                  title="Sauvegarder en brouillon"
                >
                  💾 Brouillon
                </button>

                <button
                  type="button"
                  disabled={savingStudioTest || studioQuestions.length === 0}
                  onClick={() => handleSaveStudioTest(true)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: savingStudioTest || studioQuestions.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                  }}
                  title="Valider et publier immédiatement le test pour les candidats"
                >
                  {savingStudioTest ? 'Publication...' : '🚀 Publier le Test'}
                </button>

                <button
                  type="button"
                  onClick={() => setStudioOpen(false)}
                  style={{
                    background: '#e2e8f0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#475569',
                    marginLeft: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Corps du Studio avec bascule Chat / Test / Split */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  studioView === 'chat'
                    ? '1fr'
                    : studioView === 'test'
                    ? '1fr'
                    : '420px 1fr',
                flex: 1,
                minHeight: 0,
              }}
            >
              {/* ========================================================================= */}
              {/* PANNEAU 1 : BOÎTE DE CHAT AVEC L'AGENT IA */}
              {/* ========================================================================= */}
              {(studioView === 'chat' || studioView === 'split') && (
                <div
                  style={{
                    borderRight: studioView === 'split' ? '1px solid #e2e8f0' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#f8fafc',
                    minHeight: 0,
                  }}
                >
                  {/* Bannière d'aide & bascule rapide vers le test */}
                  {studioView === 'chat' && (
                    <div
                      style={{
                        padding: '10px 18px',
                        background: '#eff6ff',
                        borderBottom: '1px solid #dbeafe',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600 }}>
                        💬 Vous discutez avec l'Agent IA. Vous avez actuellement <strong>{studioQuestions.length} question(s)</strong> dans votre test.
                      </span>
                      <button
                        type="button"
                        onClick={() => setStudioView('test')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Basculer vers la Boîte de Test ➔
                      </button>
                    </div>
                  )}

                  {/* Suggestions rapides */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                      💡 Consignes rapides à l'Agent :
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleSendAgentMessage('Génère 5 questions de niveau Confirmé/Senior adaptées aux compétences requises de cette offre.')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #c7d2fe',
                          background: '#eef2ff',
                          color: '#3730a3',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✨ 5 questions Senior
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendAgentMessage('Ajoute 2 questions techniques poussées axées sur la sécurité, JWT et les failles OWASP.')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #c7d2fe',
                          background: '#eef2ff',
                          color: '#3730a3',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        🛡️ +2 Sécurité
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendAgentMessage('Ajuste les questions pour les rendre plus pratiques avec des cas de code réels et pièges courants.')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #c7d2fe',
                          background: '#eef2ff',
                          color: '#3730a3',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        💻 Cas de code réels
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendAgentMessage('Passe la durée du test à 25 minutes et le seuil de réussite à 70%.')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fed7aa',
                          background: '#fff7ed',
                          color: '#c2410c',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ⏱️ Durée 25m & 70%
                      </button>
                    </div>
                  </div>

                  {/* Historique du Chat */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {studioChatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: studioView === 'chat' ? '70%' : '88%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            background: msg.role === 'user' ? '#4f46e5' : '#ffffff',
                            color: msg.role === 'user' ? '#ffffff' : '#0f172a',
                            border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.text}
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', padding: '0 4px' }}>
                          {msg.time}
                        </span>
                      </div>
                    ))}

                    {agentThinking && (
                      <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                        <span className="la la-spinner la-spin" style={{ color: '#4f46e5', fontSize: '16px' }}></span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>L'agent IA prépare les questions du test...</span>
                      </div>
                    )}
                  </div>

                  {/* Input du Chat */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAgentMessage();
                    }}
                    style={{
                      padding: '12px 16px',
                      borderTop: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Demandez à l'agent IA (ex: 'Ajoute 2 questions sur SQL', 'Modifie la difficulté')..."
                      disabled={agentThinking}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={agentThinking || !chatInput.trim()}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: agentThinking || !chatInput.trim() ? '#cbd5e1' : '#4f46e5',
                        color: '#ffffff',
                        cursor: agentThinking || !chatInput.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      Envoyer
                    </button>
                  </form>
                </div>
              )}

              {/* ========================================================================= */}
              {/* PANNEAU 2 : BOÎTE DE TEST (VÉRIFICATEUR & QUESTIONS DU TEST) */}
              {/* ========================================================================= */}
              {(studioView === 'test' || studioView === 'split') && (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: '#ffffff' }}>
                  {/* Bannière de bascule vers le chat quand on est en mode test seul */}
                  {studioView === 'test' && (
                    <div
                      style={{
                        padding: '10px 20px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                        📝 <strong>Boîte de Test</strong> : Vous visualisez et modifiez les questions du test avant de le publier.
                      </span>
                      <button
                        type="button"
                        onClick={() => setStudioView('chat')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1px solid #c7d2fe',
                          background: '#eef2ff',
                          color: '#4338ca',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        💬 Basculer vers la Boîte de Chat IA ➔
                      </button>
                    </div>
                  )}

                  {/* Paramètres Généraux du Test */}
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 110px 110px', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Titre du Test :
                        </label>
                        <input
                          type="text"
                          value={studioTitre}
                          onChange={(e) => setStudioTitre(e.target.value)}
                          placeholder="Ex: Évaluation Lead Java 21 & React"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Offre d'emploi :
                        </label>
                        <select
                          value={studioOffre?.id || ''}
                          onChange={(e) => {
                            const o = offres.find((x) => x.id === Number(e.target.value));
                            setStudioOffre(o || null);
                          }}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        >
                          {offres.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.titre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Durée :
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="5"
                            max="180"
                            value={studioDuree}
                            onChange={(e) => setStudioDuree(Number(e.target.value))}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>min</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Seuil :
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="20"
                            max="100"
                            value={studioScoreMin}
                            onChange={(e) => setStudioScoreMin(Number(e.target.value))}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Liste des Questions & Vérificateur */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h5 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                          Vérification des Questions QCM ({studioQuestions.length})
                        </h5>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Vérifiez l'énoncé, cochez la pastille radio verte sur la bonne réponse et modifiez au besoin.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddManualQuestion}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#334155',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        ➕ Ajouter une question manuelle
                      </button>
                    </div>

                    {studioQuestions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#fafafa' }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                          Aucune question générée pour le moment.
                        </p>
                        <button
                          type="button"
                          onClick={() => setStudioView('chat')}
                          className="theme-btn btn-style-one"
                          style={{ marginTop: '12px', padding: '8px 18px', fontSize: '13px' }}
                        >
                          💬 Ouvrir la boîte de chat pour demander à l'IA
                        </button>
                      </div>
                    ) : (
                      studioQuestions.map((q, qIdx) => (
                        <div
                          key={q.id || qIdx}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px',
                            background: '#ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          }}
                        >
                          {/* En-tête de la question */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '3px 10px', borderRadius: '8px' }}>
                              Question {qIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(qIdx)}
                              title="Supprimer cette question"
                              style={{
                                border: 'none',
                                background: '#fee2e2',
                                color: '#dc2626',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              🗑️ Supprimer
                            </button>
                          </div>

                          {/* Énoncé de la question */}
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => handleUpdateQuestion(qIdx, { question: e.target.value })}
                            placeholder="Énoncé de la question..."
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              fontWeight: 600,
                              marginBottom: '12px',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit',
                            }}
                          />

                          {/* Choix A, B, C, D avec sélection radio de la bonne réponse */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                            {(q.options || []).map((opt, optIdx) => {
                              const isCorrect = q.bonneReponse === optIdx;
                              const letters = ['A', 'B', 'C', 'D'];
                              return (
                                <div
                                  key={optIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: `1px solid ${isCorrect ? '#86efac' : '#e2e8f0'}`,
                                    background: isCorrect ? '#f0fdf4' : '#fafafa',
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`correct-q-${qIdx}`}
                                    checked={isCorrect}
                                    onChange={() => handleUpdateQuestion(qIdx, { bonneReponse: optIdx })}
                                    title="Marquer comme bonne réponse"
                                    style={{ cursor: 'pointer', accentColor: '#16a34a' }}
                                  />
                                  <span style={{ fontWeight: 700, fontSize: '12px', color: isCorrect ? '#166534' : '#64748b' }}>
                                    {letters[optIdx]}.
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                    placeholder={`Option ${letters[optIdx]}`}
                                    style={{
                                      flex: 1,
                                      padding: '6px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid #cbd5e1',
                                      fontSize: '12px',
                                      background: '#ffffff',
                                      boxSizing: 'border-box',
                                    }}
                                  />
                                  {isCorrect && (
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
                                      ✓ Bonne
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explication didactique */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              💡 Explication :
                            </span>
                            <input
                              type="text"
                              value={q.explication || ''}
                              onChange={(e) => handleUpdateQuestion(qIdx, { explication: e.target.value })}
                              placeholder="Pourquoi cette réponse est correcte..."
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                borderRadius: '4px',
                                border: '1px dashed #cbd5e1',
                                fontSize: '12px',
                                color: '#475569',
                                background: '#f8fafc',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BARRE D'ACTIONS GLOBALE (PIED DE PAGE) TOUJOURS ACCESSIBLE AVEC BOUTON PUBLIER */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: '#475569' }}>
                <div>
                  Test : <strong>{studioQuestions.length} questions validées</strong>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setStudioView(studioView === 'chat' ? 'test' : 'chat')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    {studioView === 'chat' ? '👉 Aller à la Boîte de Test' : '👈 Revenir à la Boîte de Chat'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStudioOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Fermer
                </button>

                <button
                  type="button"
                  disabled={savingStudioTest || studioQuestions.length === 0}
                  onClick={() => handleSaveStudioTest(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    color: '#1e293b',
                    fontWeight: 700,
                    cursor: savingStudioTest || studioQuestions.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                  title="Enregistrer les modifications en brouillon sans publier aux candidats"
                >
                  💾 Enregistrer Brouillon
                </button>

                <button
                  type="button"
                  disabled={savingStudioTest || studioQuestions.length === 0}
                  onClick={() => handleSaveStudioTest(true)}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: savingStudioTest || studioQuestions.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                  title="Valider définitivement et rendre le test accessible aux candidats"
                >
                  {savingStudioTest ? 'Publication en cours...' : '🚀 Valider & Publier le Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : DÉTAILS DES RÉPONSES DU CANDIDAT AU TEST */}
      {/* ========================================================================= */}
      {selectedPassageDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setSelectedPassageDetail(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du Modal Réponses */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: '#f8fafc',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                  📊 Feuille de Réponses Candidat
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedPassageDetail.candidatNom}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                  {selectedPassageDetail.candidatEmail} · Test : <strong>{selectedPassageDetail.testTitre}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: selectedPassageDetail.reussi ? '#059669' : '#dc2626' }}>
                    {selectedPassageDetail.score}%
                  </div>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: selectedPassageDetail.reussi ? '#dcfce7' : '#fee2e2',
                      color: selectedPassageDetail.reussi ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {selectedPassageDetail.reussi ? '✓ TEST VALIDÉ' : '✗ NON VALIDÉ'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPassageDetail(null)}
                  style={{
                    background: '#e2e8f0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#475569',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Liste Détaillée des Questions et Réponses */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', fontSize: '13px', color: '#475569' }}>
                <div>Bonnes réponses : <strong>{selectedPassageDetail.bonnesReponses} / {selectedPassageDetail.totalQuestions}</strong></div>
                <div>•</div>
                <div>Date : <strong>{new Date(selectedPassageDetail.datePassage).toLocaleString('fr-FR')}</strong></div>
              </div>

              {selectedPassageDetail.details.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    border: `1px solid ${item.estCorrect ? '#86efac' : '#fca5a5'}`,
                    borderRadius: '14px',
                    padding: '18px',
                    background: item.estCorrect ? '#f0fdf4' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      Question {item.index + 1}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: item.estCorrect ? '#dcfce7' : '#fee2e2',
                        color: item.estCorrect ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {item.estCorrect ? '✓ Réponse Correcte (+1 pt)' : '✗ Réponse Incorrecte (0 pt)'}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                    {item.question}
                  </p>

                  {/* Choix QCM avec mise en évidence du choix candidat vs bonne réponse */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {item.options.map((opt, optIdx) => {
                      const wasChosen = item.choixCandidat === optIdx;
                      const isCorrect = item.bonneReponse === optIdx;
                      const letters = ['A', 'B', 'C', 'D'];

                      let bg = '#f8fafc';
                      let border = '#e2e8f0';
                      let label = '';
                      let labelColor = '#64748b';

                      if (wasChosen && isCorrect) {
                        bg = '#dcfce7';
                        border = '#16a34a';
                        label = '✓ Choisi par le candidat (Bonne réponse)';
                        labelColor = '#15803d';
                      } else if (wasChosen && !isCorrect) {
                        bg = '#fee2e2';
                        border = '#dc2626';
                        label = '✗ Choisi par le candidat (Faux)';
                        labelColor = '#b91c1c';
                      } else if (isCorrect) {
                        bg = '#f0fdf4';
                        border = '#22c55e';
                        label = '★ Bonne réponse attendue';
                        labelColor = '#166534';
                      }

                      return (
                        <div
                          key={optIdx}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: `1.5px solid ${border}`,
                            background: bg,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px',
                          }}
                        >
                          <div>
                            <strong style={{ marginRight: '6px' }}>{letters[optIdx]}.</strong>
                            {opt}
                          </div>
                          {label && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: labelColor }}>
                              {label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {item.explication && (
                    <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#475569', borderLeft: '3px solid #6366f1' }}>
                      <strong>💡 Note explicative :</strong> {item.explication}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Modal Réponses */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedPassageDetail(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <VisioconferenceModal
        open={!!activeVisioEntretien}
        entretien={activeVisioEntretien}
        onClose={() => setActiveVisioEntretien(null)}
        userRole="ENTREPRISE"
        userName={entreprise?.nomEntreprise || user?.nom || 'Recruteur'}
      />
    </DashboardLayout>
  );
};
