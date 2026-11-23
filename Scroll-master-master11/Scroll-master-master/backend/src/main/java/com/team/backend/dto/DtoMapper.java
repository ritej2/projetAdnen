package com.team.backend.dto;

import com.team.backend.entity.*;
import org.springframework.stereotype.Component;

@Component
public class DtoMapper {

    public UtilisateurDTO toUtilisateurDTO(Utilisateur u, Long candidatId, Long entrepriseId) {
        if (u == null) return null;
        return new UtilisateurDTO(
            u.getId(),
            u.getFirebaseUid(),
            u.getNom(),
            u.getEmail(),
            u.getTelephone(),
            u.getRole(),
            u.getDateCreation(),
            u.isActif(),
            candidatId,
            entrepriseId
        );
    }

    public CandidatDTO toCandidatDTO(Candidat c) {
        if (c == null) return null;
        Utilisateur u = c.getUtilisateur();
        int filled = 0;
        int total = 8;
        if (u != null && notBlank(u.getNom())) filled++;
        if (u != null && notBlank(u.getTelephone())) filled++;
        if (notBlank(c.getTitreProfil())) filled++;
        if (notBlank(c.getBio())) filled++;
        if (notBlank(c.getAdresse())) filled++;
        if (notBlank(c.getCompetences())) filled++;
        if (notBlank(c.getExperience()) || notBlank(c.getFormation())) filled++;
        if (notBlank(c.getCvUrl())) filled++;
        int completion = Math.min(100, Math.round((filled * 100f) / total));

        return new CandidatDTO(
            c.getId(),
            u != null ? u.getId() : null,
            u != null ? u.getNom() : null,
            u != null ? u.getEmail() : null,
            u != null ? u.getTelephone() : null,
            c.getTitreProfil(),
            c.getBio(),
            c.getAdresse(),
            c.getCompetences(),
            c.getFormation(),
            c.getExperience(),
            c.getCvUrl(),
            c.getLinkedinUrl(),
            c.getPortfolioUrl(),
            c.getPhotoUrl(),
            completion
        );
    }

    public EntrepriseDTO toEntrepriseDTO(Entreprise e, long activeOffersCount) {
        if (e == null) return null;
        Utilisateur u = e.getUtilisateur();
        return new EntrepriseDTO(
            e.getId(),
            u != null ? u.getId() : null,
            u != null ? u.getNom() : null,
            u != null ? u.getEmail() : null,
            u != null ? u.getTelephone() : null,
            e.getNomEntreprise(),
            e.getSecteur(),
            e.getDescription(),
            e.getAdresse(),
            e.getSiteWeb(),
            e.getTailleEntreprise(),
            e.getLogoUrl(),
            e.isVerifiee(),
            activeOffersCount
        );
    }

    public OffreDTO toOffreDTO(Offre o, long applicationsCount) {
        if (o == null) return null;
        Entreprise e = o.getEntreprise();
        return new OffreDTO(
            o.getId(),
            e != null ? e.getId() : null,
            e != null ? e.getNomEntreprise() : null,
            e != null ? e.getSecteur() : null,
            e != null ? e.getLogoUrl() : null,
            e != null && e.isVerifiee(),
            o.getTitre(),
            o.getDescription(),
            o.getMissions(),
            o.getProfilRecherche(),
            o.getLocalisation(),
            o.getModeTravail(),
            o.getCategorie(),
            o.getTypeContrat(),
            o.getNiveauExperience(),
            o.getCompetencesRequises(),
            o.getSalaire(),
            o.getSalaireMax(),
            o.getDatePublication(),
            o.getDateExpiration(),
            o.getStatut(),
            applicationsCount
        );
    }

    public CandidatureDTO toCandidatureDTO(Candidature c) {
        if (c == null) return null;
        Candidat cand = c.getCandidat();
        Utilisateur candUser = cand != null ? cand.getUtilisateur() : null;
        Offre offre = c.getOffre();
        Entreprise ent = offre != null ? offre.getEntreprise() : null;

        String effectiveCv = notBlank(c.getCvUrlSpecifique())
            ? c.getCvUrlSpecifique()
            : (cand != null ? cand.getCvUrl() : null);

        return new CandidatureDTO(
            c.getId(),
            cand != null ? cand.getId() : null,
            candUser != null ? candUser.getNom() : null,
            candUser != null ? candUser.getEmail() : null,
            candUser != null ? candUser.getTelephone() : null,
            cand != null ? cand.getTitreProfil() : null,
            cand != null ? cand.getCompetences() : null,
            cand != null ? cand.getExperience() : null,
            cand != null ? cand.getFormation() : null,
            effectiveCv,
            offre != null ? offre.getId() : null,
            offre != null ? offre.getTitre() : null,
            offre != null ? offre.getLocalisation() : null,
            offre != null ? offre.getTypeContrat() : null,
            offre != null ? offre.getSalaire() : null,
            ent != null ? ent.getId() : null,
            ent != null ? ent.getNomEntreprise() : null,
            ent != null ? ent.getLogoUrl() : null,
            c.getDateCandidature(),
            c.getStatut(),
            c.getLettreMotivation(),
            c.getCvUrlSpecifique(),
            c.getNoteRecruteur(),
            c.getScoreMatching()
        );
    }

    public EntretienDTO toEntretienDTO(Entretien e) {
        if (e == null) return null;
        Candidature candApp = e.getCandidature();
        Candidat cand = candApp != null ? candApp.getCandidat() : null;
        Utilisateur candUser = cand != null ? cand.getUtilisateur() : null;
        Offre offre = candApp != null ? candApp.getOffre() : null;
        Entreprise ent = offre != null ? offre.getEntreprise() : null;

        return new EntretienDTO(
            e.getId(),
            candApp != null ? candApp.getId() : null,
            offre != null ? offre.getId() : null,
            offre != null ? offre.getTitre() : null,
            cand != null ? cand.getId() : null,
            candUser != null ? candUser.getNom() : null,
            candUser != null ? candUser.getEmail() : null,
            ent != null ? ent.getId() : null,
            ent != null ? ent.getNomEntreprise() : null,
            e.getDateEntretien(),
            e.getTypeEntretien(),
            e.getLienOuLieu(),
            e.getStatut(),
            e.getCommentaire()
        );
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
