# JobFlow Mobile - Application Mobile Android / iOS (React Native + Expo)

Version mobile officielle de la plateforme de recrutement **JobFlow** (TalentFlow), développée avec **React Native**, **Expo** et connectée à l'API **Java Spring Boot** existante avec base de données **MySQL**.

---

## 📱 Fonctionnalités Principales

### 👤 Espace Candidat
* **Exploration des offres d'emploi** : Recherche par mot-clé, filtrage par type de contrat (CDI, CDD, Stage, Alternance, Freelance).
* **Fiche détaillée de poste** : Missions, profil recherché, salaire, compétences requises, mode de travail.
* **Système de Favoris** : Sauvegarde d'offres préférées.
* **Postulation directe** : Saisie d'une lettre d'accompagnement et transmission de la candidature au recruteur.
* **Passage de Test Technique QCM** : Évaluation interactive avec chronomètre, validation des réponses et calcul immédiat du score avec seuil de réussite.
* **Suivi des candidatures** : Statuts en temps réel (*En attente*, *En cours d'examen*, *Entretien*, *Acceptée*, *Refusée*) avec score de matching IA.
* **Entretiens** : Consultation des entretiens planifiés avec bouton d'accès direct au lien de visioconférence (Google Meet, Teams, etc.).
* **Gestion du profil** : Compétences, bio, coordonnées et déconnexion.

### 🏢 Espace Entreprise / Recruteur
* **Tableau de bord Recruteur** : Indicateurs clés (offres actives, candidatures reçues en attente, entretiens planifiés).
* **Publication & Gestion des offres** : Formulaire complet de création de poste avec critères de salaire, localisation et compétences.
* **Gestion des candidatures reçues** : Consultation du profil candidat, score de matching, mise à jour du statut (*Accepter*, *Refuser*, *En examen*).
* **Évaluation intelligente par IA** : Calcul de la note sur 20 et recommandation basée sur l'adéquation du profil.
* **Planification d'entretiens** : Choix de la date, de l'heure, du format (visio ou présentiel) et ajout du lien de visioconférence.
* **Fiche Entreprise** : Coordonnées, secteur d'activité, site web et description.

### 🔐 Authentification & Rôles
* Connexion par email / mot de passe.
* **Boutons d'accès rapide Démo** (Connexion instantanée en un clic pour tester sans mot de passe : *Démo Candidat*, *Démo Entreprise*).
* Inscription avec choix de rôle (*Candidat* ou *Entreprise*).
* Bascule automatique et dynamique de navigation selon le profil connecté.

---

## 📂 Architecture du Projet Mobile (`mobile/`)

```
mobile/
├── package.json
├── app.json
├── index.js
├── App.js
└── src/
    ├── api/
    │   └── (client axios)
    ├── components/
    │   ├── ApplicationCard.js
    │   ├── CustomButton.js
    │   ├── CustomInput.js
    │   ├── EmptyState.js
    │   ├── Header.js
    │   ├── JobCard.js
    │   └── StatusBadge.js
    ├── context/
    │   └── AuthContext.js
    ├── navigation/
    │   ├── AuthNavigator.js
    │   ├── CandidateNavigator.js
    │   ├── CompanyNavigator.js
    │   └── RootNavigator.js
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js
    │   │   └── RegisterScreen.js
    │   ├── candidate/
    │   │   ├── ApplyModalScreen.js
    │   │   ├── CandidateProfileScreen.js
    │   │   ├── InterviewsScreen.js
    │   │   ├── JobDetailScreen.js
    │   │   ├── JobListScreen.js
    │   │   ├── MyApplicationsScreen.js
    │   │   └── TakeTestScreen.js
    │   └── company/
    │       ├── CompanyApplicationsScreen.js
    │       ├── CompanyDashboardScreen.js
    │       ├── CompanyJobsScreen.js
    │       ├── CompanyProfileScreen.js
    │       ├── CreateJobScreen.js
    │       └── ScheduleInterviewScreen.js
    ├── services/
    │   ├── api.js
    │   ├── applicationService.js
    │   ├── authService.js
    │   ├── favoriteService.js
    │   ├── interviewService.js
    │   ├── jobService.js
    │   └── testService.js
    └── utils/
        ├── constants.js
        └── formatters.js
```

---

## 🚀 Démarrage Rapide

### 1. Prérequis
* Node.js installé (v18+).
* Le backend Java Spring Boot démarré sur le port `8081`.

### 2. Installation des dépendances
```bash
cd mobile
npm install
```

### 3. Lancer l'application mobile avec Expo
```bash
npx expo start
```
* **Sur Émulateur Android** : appuyez sur `a` dans le terminal.
* **Sur Téléphone physique (Android ou iPhone)** : installez l'application **Expo Go** depuis Google Play Store ou l'App Store, puis scannez le QR code affiché dans le terminal.
* **Sur Navigateur Web** : appuyez sur `w`.

### 4. Configuration de l'IP du Backend Spring Boot
Sur l'écran de connexion de l'application mobile, cliquez en bas sur **Backend : http://...** pour modifier l'adresse :
* Sur Émulateur Android : `http://10.0.2.2:8081` (par défaut).
* Sur appareil physique connecté au même Wi-Fi : `http://VOTRE_IP_LOCALE:8081` (ex: `http://192.168.1.50:8081`).
