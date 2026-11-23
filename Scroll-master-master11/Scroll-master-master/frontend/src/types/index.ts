export type RoleUtilisateur = 'CANDIDAT' | 'ENTREPRISE' | 'ADMIN';

export type StatutOffre = 'BROUILLON' | 'ACTIVE' | 'FERMEE' | 'ARCHIVEE' | 'SUSPENDUE';

export type StatutCandidature =
  | 'EN_ATTENTE'
  | 'EN_COURS_EXAMEN'
  | 'ENTRETIEN'
  | 'ACCEPTEE'
  | 'REFUSEE'
  | 'RETIREE';

export type StatutEntretien = 'PLANIFIE' | 'TERMINE' | 'ANNULE';

export interface Utilisateur {
  id: number;
  firebaseUid: string;
  nom: string;
  email: string;
  telephone?: string;
  role: RoleUtilisateur;
  dateCreation: string;
  actif: boolean;
  candidatId?: number;
  entrepriseId?: number;
}

export interface Candidat {
  id: number;
  utilisateurId: number;
  nom: string;
  email: string;
  telephone?: string;
  titreProfil?: string;
  bio?: string;
  adresse?: string;
  competences?: string;
  formation?: string;
  experience?: string;
  cvUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  photoUrl?: string;
  completionPercentage: number;
}

export interface Entreprise {
  id: number;
  utilisateurId: number;
  nomContact?: string;
  email: string;
  telephone?: string;
  nomEntreprise: string;
  secteur?: string;
  description?: string;
  adresse?: string;
  siteWeb?: string;
  tailleEntreprise?: string;
  logoUrl?: string;
  verifiee: boolean;
  nombreOffresActives: number;
}

export interface Offre {
  id: number;
  entrepriseId: number;
  nomEntreprise: string;
  secteurEntreprise?: string;
  logoEntreprise?: string;
  entrepriseVerifiee: boolean;
  titre: string;
  description: string;
  missions?: string;
  profilRecherche?: string;
  localisation: string;
  modeTravail?: string;
  categorie?: string;
  typeContrat: string;
  niveauExperience?: string;
  competencesRequises?: string;
  salaire?: number;
  salaireMax?: number;
  datePublication: string;
  dateExpiration?: string;
  statut: StatutOffre;
  nombreCandidatures: number;
}

export interface Candidature {
  id: number;
  candidatId: number;
  candidatNom: string;
  candidatEmail: string;
  candidatTelephone?: string;
  candidatTitre?: string;
  candidatCompetences?: string;
  candidatExperience?: string;
  candidatFormation?: string;
  candidatCvUrl?: string;
  offreId: number;
  offreTitre: string;
  offreLocalisation: string;
  offreTypeContrat: string;
  offreSalaire?: number;
  entrepriseId: number;
  nomEntreprise: string;
  logoEntreprise?: string;
  dateCandidature: string;
  statut: StatutCandidature;
  lettreMotivation?: string;
  cvUrlSpecifique?: string;
  noteRecruteur?: string;
  scoreMatching?: number;
}

export interface Entretien {
  id: number;
  candidatureId: number;
  offreId: number;
  offreTitre: string;
  candidatId: number;
  candidatNom: string;
  candidatEmail: string;
  entrepriseId: number;
  nomEntreprise: string;
  dateEntretien: string;
  typeEntretien: string;
  lienOuLieu?: string;
  statut: StatutEntretien;
  commentaire?: string;
}

export interface Favori {
  id: number;
  candidatId: number;
  dateAjout: string;
  offre: Offre;
}

export interface Recherche {
  id: number;
  candidatId: number;
  motCle?: string;
  localisation?: string;
  typeContrat?: string;
  categorie?: string;
  dateRecherche: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface QuestionDTO {
  id: number;
  question: string;
  options: string[];
  bonneReponse: number;
  explication?: string;
}

export interface TestTechnique {
  id: number;
  offreId: number;
  offreTitre: string;
  nomEntreprise: string;
  titre: string;
  description?: string;
  dureeMinutes: number;
  scoreMinimum: number;
  questions: QuestionDTO[];
  genereParIa: boolean;
  publie?: boolean;
  statut?: 'BROUILLON' | 'PUBLIE' | string;
  dateCreation: string;
  nombrePassages?: number;
}

export interface DetailReponseQuestion {
  index: number;
  question: string;
  options: string[];
  choixCandidat: number;
  bonneReponse: number;
  estCorrect: boolean;
  explication?: string;
}

export interface PassageDetailDTO {
  passageId: number;
  testId: number;
  testTitre: string;
  candidatureId: number;
  candidatNom: string;
  candidatEmail: string;
  score: number;
  bonnesReponses: number;
  totalQuestions: number;
  reussi: boolean;
  datePassage: string;
  details: DetailReponseQuestion[];
}

export interface AgentChatResponse {
  messageAgent: string;
  titreTest: string;
  description: string;
  dureeMinutes: number;
  scoreMinimum: number;
  questions: QuestionDTO[];
  validePourPublication: boolean;
}

export interface PassageTest {
  id: number;
  testId: number;
  testTitre: string;
  candidatureId: number;
  candidatId: number;
  candidatNom: string;
  candidatEmail: string;
  offreId: number;
  offreTitre: string;
  bonnesReponses: number;
  totalQuestions: number;
  score: number;
  reussi: boolean;
  datePassage: string;
}

export interface EvaluationIA {
  id: number;
  candidatureId: number;
  candidatId: number;
  candidatNom: string;
  candidatEmail: string;
  candidatTitre?: string;
  cvUrl?: string;
  offreId: number;
  offreTitre: string;
  nomEntreprise: string;
  noteSur20: number;
  scoreGlobal: number;
  scoreCompetences: number;
  scoreExperience: number;
  scoreFormation: number;
  scoreMotivation: number;
  scoreProfil: number;
  scoreTest?: number;
  recommandation: 'ACCEPTER' | 'ENTRETIEN' | 'A_EXAMINER' | 'REFUSER' | string;
  niveauConfiance: number;
  competencesTrouvees: string[];
  competencesManquantes: string[];
  pointsForts: string[];
  pointsAmelioration: string[];
  synthese: string;
  decisionRecruteur?: string;
  commentaireRecruteur?: string;
  dateValidation?: string;
  dateEvaluation: string;
}

