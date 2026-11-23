-- ============================================================================
-- TalentFlow PostgreSQL Database Setup Script
-- Database: talentflow
-- PostgreSQL 15+
-- ============================================================================

-- Run this script in psql or pgAdmin connected to your PostgreSQL server:
-- CREATE DATABASE talentflow WITH ENCODING 'UTF8';

CREATE TABLE IF NOT EXISTS utilisateurs (
    id BIGSERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    nom VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    telephone VARCHAR(40),
    role VARCHAR(30) NOT NULL CHECK (role IN ('CANDIDAT', 'ENTREPRISE', 'ADMIN')),
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_firebase_uid ON utilisateurs(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);

CREATE TABLE IF NOT EXISTS candidats (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    titre_profil VARCHAR(180),
    bio TEXT,
    adresse VARCHAR(255),
    competences TEXT,
    formation TEXT,
    experience TEXT,
    cv_url VARCHAR(500),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS entreprises (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    nom_entreprise VARCHAR(180) NOT NULL,
    secteur VARCHAR(120),
    description TEXT,
    adresse VARCHAR(255),
    site_web VARCHAR(255),
    taille_entreprise VARCHAR(80),
    logo_url VARCHAR(500),
    verifiee BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS offres (
    id BIGSERIAL PRIMARY KEY,
    entreprise_id BIGINT NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    titre VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    missions TEXT,
    profil_recherche TEXT,
    localisation VARCHAR(180) NOT NULL,
    mode_travail VARCHAR(60) DEFAULT 'Hybride',
    categorie VARCHAR(100) DEFAULT 'Ingénierie & Tech',
    type_contrat VARCHAR(60) NOT NULL,
    niveau_experience VARCHAR(80) DEFAULT 'Confirmé',
    competences_requises TEXT,
    salaire DECIMAL(12, 2),
    salaire_max DECIMAL(12, 2),
    date_publication DATE NOT NULL DEFAULT CURRENT_DATE,
    date_expiration DATE,
    statut VARCHAR(40) NOT NULL DEFAULT 'ACTIVE' CHECK (statut IN ('BROUILLON', 'ACTIVE', 'FERMEE', 'ARCHIVEE', 'SUSPENDUE'))
);

CREATE INDEX IF NOT EXISTS idx_offres_entreprise ON offres(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_offres_statut ON offres(statut);
CREATE INDEX IF NOT EXISTS idx_offres_localisation ON offres(localisation);
CREATE INDEX IF NOT EXISTS idx_offres_type_contrat ON offres(type_contrat);

CREATE TABLE IF NOT EXISTS candidatures (
    id BIGSERIAL PRIMARY KEY,
    candidat_id BIGINT NOT NULL REFERENCES candidats(id) ON DELETE CASCADE,
    offre_id BIGINT NOT NULL REFERENCES offres(id) ON DELETE CASCADE,
    date_candidature TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(40) NOT NULL DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'EN_COURS_EXAMEN', 'ENTRETIEN', 'ACCEPTEE', 'REFUSEE', 'RETIREE')),
    lettre_motivation TEXT,
    cv_url_specifique VARCHAR(500),
    note_recruteur TEXT,
    score_matching INT DEFAULT 85,
    CONSTRAINT uq_candidature_candidat_offre UNIQUE (candidat_id, offre_id)
);

CREATE INDEX IF NOT EXISTS idx_candidatures_candidat ON candidatures(candidat_id);
CREATE INDEX IF NOT EXISTS idx_candidatures_offre ON candidatures(offre_id);

CREATE TABLE IF NOT EXISTS entretiens (
    id BIGSERIAL PRIMARY KEY,
    candidature_id BIGINT NOT NULL REFERENCES candidatures(id) ON DELETE CASCADE,
    date_entretien TIMESTAMP NOT NULL,
    type_entretien VARCHAR(80) DEFAULT 'Visioconférence',
    lien_ou_lieu VARCHAR(500),
    statut VARCHAR(40) NOT NULL DEFAULT 'PLANIFIE' CHECK (statut IN ('PLANIFIE', 'TERMINE', 'ANNULE')),
    commentaire TEXT
);

CREATE INDEX IF NOT EXISTS idx_entretiens_candidature ON entretiens(candidature_id);

CREATE TABLE IF NOT EXISTS favoris (
    id BIGSERIAL PRIMARY KEY,
    candidat_id BIGINT NOT NULL REFERENCES candidats(id) ON DELETE CASCADE,
    offre_id BIGINT NOT NULL REFERENCES offres(id) ON DELETE CASCADE,
    date_ajout TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_favori_candidat_offre UNIQUE (candidat_id, offre_id)
);

CREATE TABLE IF NOT EXISTS recherches (
    id BIGSERIAL PRIMARY KEY,
    candidat_id BIGINT NOT NULL REFERENCES candidats(id) ON DELETE CASCADE,
    mot_cle VARCHAR(180),
    localisation VARCHAR(180),
    type_contrat VARCHAR(80),
    categorie VARCHAR(100),
    date_recherche TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
