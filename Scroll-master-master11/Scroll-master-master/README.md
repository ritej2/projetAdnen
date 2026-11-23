# TalentFlow — Plateforme SaaS de Gestion des Offres d’Emploi et des Candidatures

**TalentFlow** est une application web complète de recrutement conçue selon le modèle UML du projet, intégrant **React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion** côté frontend, **Spring Boot 3.4 + Java 21 + Spring Security + Spring Data JPA + Flyway** côté backend, **PostgreSQL** pour la persistance relationnelle et **Firebase (Authentication & Storage)** pour la gestion d’identité et le stockage sécurisé des CV et logos.

---

## 1. Architecture & Technologies

| Couche | Technologies utilisées |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion, React Router v7, Axios, Lucide React, Recharts, Sonner |
| **Backend** | Java 21, Spring Boot 3.4.3, Spring Web, Spring Data JPA / Hibernate, Spring Security, Jakarta Validation, Flyway, Springdoc OpenAPI (Swagger) |
| **Base de données** | PostgreSQL (`talentflow_postgres.sql` + migration Flyway `V1__init_talentflow_schema.sql`) + profil `dev` intégré (H2 en mode compatibilité PostgreSQL avec jeu de données initial) |
| **Identité & Fichiers** | Firebase Authentication, Firebase Admin SDK, Firebase Storage (`storage.rules`) + contrôleur sécurisé `/api/files` |

---

## 2. Modèle de Données UML Implémenté

Toutes les entités JPA, leurs attributs, énumérations et relations du diagramme UML sont implémentés dans `backend/src/main/java/com/team/backend/entity/` :
- **`Utilisateur`** (`id`, `firebaseUid`, `nom`, `email`, `telephone`, `role: CANDIDAT | ENTREPRISE | ADMIN`, `dateCreation`, `actif`)
- **`Candidat`** (`@OneToOne` avec `Utilisateur`, `titreProfil`, `bio`, `adresse`, `competences`, `formation`, `experience`, `cvUrl`)
- **`Entreprise`** (`@OneToOne` avec `Utilisateur`, `nomEntreprise`, `secteur`, `description`, `adresse`, `siteWeb`, `tailleEntreprise`, `logoUrl`, `verifiee`)
- **`Offre`** (`@ManyToOne` avec `Entreprise`, `titre`, `description`, `missions`, `profilRecherche`, `localisation`, `typeContrat`, `salaire`, `salaireMax`, `datePublication`, `statut: BROUILLON | ACTIVE | FERMEE | ARCHIVEE | SUSPENDUE`)
- **`Candidature`** (`@ManyToOne` avec `Candidat` et `Offre`, contrainte d'unicité `UNIQUE(candidat_id, offre_id)` empêchant les candidatures multiples, `dateCandidature`, `statut: EN_ATTENTE | EN_COURS_EXAMEN | ENTRETIEN | ACCEPTEE | REFUSEE | RETIREE`, `scoreMatching`)
- **`Entretien`** (`@ManyToOne` avec `Candidature`, `dateEntretien`, `typeEntretien`, `lienOuLieu`, `statut: PLANIFIE | TERMINE | ANNULE`, `commentaire`)
- **`Favori`** (`@ManyToOne` avec `Candidat` et `Offre`, contrainte `UNIQUE(candidat_id, offre_id)`)
- **`Recherche`** (`@ManyToOne` avec `Candidat`, `motCle`, `localisation`, `typeContrat`, `categorie`, `dateRecherche`)

---

## 3. Démarrage Rapide sous Windows (PowerShell)

### A. Lancer le Backend Spring Boot
Par défaut, le profil `dev` démarre immédiatement avec Flyway, le dialecte PostgreSQL et un jeu de données complet (Candidats, Entreprises, Offres, Candidatures, Entretiens) :

```powershell
cd Scroll-master-master\backend
$env:JAVA_HOME="C:\Users\Mohamed Gomri\.jdks\corretto-23.0.2"
.\mvnw.cmd spring-boot:run
```
- **API REST** : `http://localhost:8080/api/offres`
- **Documentation Swagger UI** : `http://localhost:8080/swagger-ui.html`
- **Exécuter les tests d'intégration JUnit** :
  ```powershell
  .\mvnw.cmd test
  ```

### B. Lancer le Frontend React (Vite + TypeScript)
Ouvrez un second terminal PowerShell :

```powershell
cd Scroll-master-master\frontend
npm install --legacy-peer-deps
npm run dev
```
- Ouvrez `http://localhost:5173` dans votre navigateur.

---

## 4. Configuration PostgreSQL (Profil Production)

1. Créez une base de données PostgreSQL nommée `talentflow` et exécutez si souhaité `database/talentflow_postgres.sql` (ou laissez Flyway appliquer automatiquement `V1__init_talentflow_schema.sql`).
2. Copiez `backend/.env.example` et définissez vos variables d'environnement :
   ```powershell
   $env:SPRING_PROFILES_ACTIVE="prod"
   $env:DB_URL="jdbc:postgresql://localhost:5432/talentflow"
   $env:DB_USERNAME="postgres"
   $env:DB_PASSWORD="votre_mot_de_passe"
   .\mvnw.cmd spring-boot:run
   ```

---

## 5. Configuration Firebase (Authentication & Storage)

1. Créez un projet dans la [Console Firebase](https://console.firebase.google.com/).
2. Activez **Authentication** (Fournisseur Email/Mot de passe) et **Storage**.
3. Déployez les règles de sécurité situées dans `storage.rules` pour protéger les CV PDF privés (`/cvs/{userId}/{fileName}`) et les logos d'entreprises (`/logos/{userId}/{fileName}`).
4. Côté Frontend : copiez `frontend/.env.example` vers `frontend/.env` et renseignez vos clés `VITE_FIREBASE_*`.
5. Côté Backend : générez une clé privée de compte de service Firebase Admin (`Project Settings > Service accounts`) et indiquez son chemin dans `FIREBASE_CREDENTIALS_PATH`.

---

## 6. Comptes pré-configurés pour tester les 3 rôles

Vous pouvez basculer en un clic depuis la barre supérieure **TalentFlow Live** ou depuis la page `/auth` :
- **Candidat** : `marie.dubois@talentflow.io` (Marie Dubois — Ingénieure Full Stack Java / React)
- **Entreprise** : `recrutement@novastudio.io` (Sophie Mercier — Nova Studio)
- **Administrateur** : `admin@talentflow.io` (Alexandre Moreau — Supervision & Modération)
