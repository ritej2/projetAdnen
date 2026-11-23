package com.team.backend.controller;

import com.team.backend.dto.CandidatureDTO;
import com.team.backend.dto.DtoMapper;
import com.team.backend.entity.*;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.CandidatRepository;
import com.team.backend.repository.CandidatureRepository;
import com.team.backend.repository.EntrepriseRepository;
import com.team.backend.repository.OffreRepository;
import com.team.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidatures")
public class CandidatureController {

    private final CandidatureRepository candidatureRepository;
    private final CandidatRepository candidatRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final OffreRepository offreRepository;
    private final SecurityUtils securityUtils;
    private final DtoMapper mapper;

    public CandidatureController(
        CandidatureRepository candidatureRepository,
        CandidatRepository candidatRepository,
        EntrepriseRepository entrepriseRepository,
        OffreRepository offreRepository,
        SecurityUtils securityUtils,
        DtoMapper mapper
    ) {
        this.candidatureRepository = candidatureRepository;
        this.candidatRepository = candidatRepository;
        this.entrepriseRepository = entrepriseRepository;
        this.offreRepository = offreRepository;
        this.securityUtils = securityUtils;
        this.mapper = mapper;
    }

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public CandidatureDTO postuler(@Valid @RequestBody CandidatureDTO.CreateRequest req) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        if (u.getRole() != RoleUtilisateur.CANDIDAT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seul un candidat peut postuler à une offre.");
        }
        Candidat candidat = candidatRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Veuillez compléter votre profil candidat avant de postuler."));

        Offre offre = offreRepository.findById(req.offreId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre introuvable."));

        if (offre.getStatut() != StatutOffre.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cette offre n'est plus ouverte aux candidatures.");
        }

        if (candidatureRepository.existsByCandidatIdAndOffreId(candidat.getId(), offre.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Vous avez déjà postulé à cette offre d'emploi.");
        }

        Candidature c = new Candidature();
        c.setCandidat(candidat);
        c.setOffre(offre);
        c.setDateCandidature(LocalDateTime.now());
        c.setStatut(StatutCandidature.EN_ATTENTE);
        c.setLettreMotivation(req.lettreMotivation());
        c.setCvUrlSpecifique(
            req.cvUrlSpecifique() != null && !req.cvUrlSpecifique().isBlank()
                ? req.cvUrlSpecifique()
                : candidat.getCvUrl()
        );
        c.setScoreMatching(computeMatchingScore(candidat.getCompetences(), offre.getCompetencesRequises()));

        c = candidatureRepository.save(c);
        return mapper.toCandidatureDTO(c);
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public List<CandidatureDTO> getMyCandidatures() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Candidat candidat = candidatRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Accès réservé aux candidats."));
        return candidatureRepository.findByCandidatIdOrderByDateCandidatureDesc(candidat.getId()).stream()
            .map(mapper::toCandidatureDTO)
            .toList();
    }

    @GetMapping("/entreprise")
    @Transactional(readOnly = true)
    public List<CandidatureDTO> getEntrepriseCandidatures(@RequestParam(required = false) Long offreId) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        if (u.getRole() == RoleUtilisateur.ADMIN) {
            List<Candidature> all = (offreId != null)
                ? candidatureRepository.findByOffreIdOrderByDateCandidatureDesc(offreId)
                : candidatureRepository.findAll();
            return all.stream().map(mapper::toCandidatureDTO).toList();
        }

        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Accès réservé aux entreprises."));

        List<Candidature> list;
        if (offreId != null) {
            Offre o = offreRepository.findById(offreId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre introuvable."));
            if (!o.getEntreprise().getId().equals(e.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Cette offre n'appartient pas à votre entreprise.");
            }
            list = candidatureRepository.findByOffreIdOrderByDateCandidatureDesc(offreId);
        } else {
            list = candidatureRepository.findByOffreEntrepriseIdOrderByDateCandidatureDesc(e.getId());
        }
        return list.stream().map(mapper::toCandidatureDTO).toList();
    }

    @PatchMapping("/{id}/statut")
    @Transactional
    public CandidatureDTO updateStatut(
        @PathVariable Long id,
        @Valid @RequestBody CandidatureDTO.UpdateStatutRequest req
    ) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Candidature c = candidatureRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Candidature introuvable."));

        if (u.getRole() == RoleUtilisateur.CANDIDAT) {
            if (!c.getCandidat().getUtilisateur().getId().equals(u.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Accès refusé.");
            }
            if (req.statut() != StatutCandidature.RETIREE) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Un candidat peut uniquement retirer sa candidature.");
            }
        } else if (u.getRole() == RoleUtilisateur.ENTREPRISE) {
            Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Entreprise introuvable."));
            if (!c.getOffre().getEntreprise().getId().equals(e.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Vous ne pouvez gérer que les candidatures liées à vos offres.");
            }
        }

        c.setStatut(req.statut());
        if (req.noteRecruteur() != null) {
            c.setNoteRecruteur(req.noteRecruteur());
        }
        c = candidatureRepository.save(c);
        return mapper.toCandidatureDTO(c);
    }

    @DeleteMapping("/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdrawOrDeleteCandidature(@PathVariable Long id) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Candidature c = candidatureRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Candidature introuvable."));

        if (u.getRole() == RoleUtilisateur.CANDIDAT) {
            if (!c.getCandidat().getUtilisateur().getId().equals(u.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Vous ne pouvez supprimer que vos propres candidatures.");
            }
        } else if (u.getRole() != RoleUtilisateur.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Action non autorisée.");
        }
        candidatureRepository.delete(c);
    }

    private int computeMatchingScore(String candSkills, String offerSkills) {
        if (offerSkills == null || offerSkills.isBlank()) return 88;
        if (candSkills == null || candSkills.isBlank()) return 65;

        Set<String> cSet = Arrays.stream(candSkills.toLowerCase().split("[,;]"))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
        String[] reqArr = offerSkills.toLowerCase().split("[,;]");
        int matched = 0;
        int total = 0;
        for (String r : reqArr) {
            String trimmed = r.trim();
            if (trimmed.isEmpty()) continue;
            total++;
            if (cSet.stream().anyMatch(cs -> cs.contains(trimmed) || trimmed.contains(cs))) {
                matched++;
            }
        }
        if (total == 0) return 85;
        int raw = Math.round((matched * 100f) / total);
        return Math.max(58, Math.min(98, raw));
    }
}
