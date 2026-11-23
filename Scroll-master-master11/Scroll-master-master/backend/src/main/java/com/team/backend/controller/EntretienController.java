package com.team.backend.controller;

import com.team.backend.dto.DtoMapper;
import com.team.backend.dto.EntretienDTO;
import com.team.backend.entity.*;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.CandidatRepository;
import com.team.backend.repository.CandidatureRepository;
import com.team.backend.repository.EntrepriseRepository;
import com.team.backend.repository.EntretienRepository;
import com.team.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entretiens")
public class EntretienController {

    private final EntretienRepository entretienRepository;
    private final CandidatureRepository candidatureRepository;
    private final CandidatRepository candidatRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final SecurityUtils securityUtils;
    private final DtoMapper mapper;

    public EntretienController(
        EntretienRepository entretienRepository,
        CandidatureRepository candidatureRepository,
        CandidatRepository candidatRepository,
        EntrepriseRepository entrepriseRepository,
        SecurityUtils securityUtils,
        DtoMapper mapper
    ) {
        this.entretienRepository = entretienRepository;
        this.candidatureRepository = candidatureRepository;
        this.candidatRepository = candidatRepository;
        this.entrepriseRepository = entrepriseRepository;
        this.securityUtils = securityUtils;
        this.mapper = mapper;
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public List<EntretienDTO> getMyEntretiens() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        if (u.getRole() == RoleUtilisateur.CANDIDAT) {
            Candidat c = candidatRepository.findByUtilisateurId(u.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil candidat introuvable."));
            return entretienRepository.findByCandidatureCandidatIdOrderByDateEntretienAsc(c.getId()).stream()
                .map(mapper::toEntretienDTO)
                .toList();
        } else if (u.getRole() == RoleUtilisateur.ENTREPRISE) {
            Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil entreprise introuvable."));
            return entretienRepository.findByCandidatureOffreEntrepriseIdOrderByDateEntretienAsc(e.getId()).stream()
                .map(mapper::toEntretienDTO)
                .toList();
        } else {
            return entretienRepository.findAll().stream()
                .map(mapper::toEntretienDTO)
                .toList();
        }
    }

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public EntretienDTO scheduleEntretien(@Valid @RequestBody EntretienDTO.CreateRequest req) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Candidature candApp = candidatureRepository.findById(req.candidatureId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Candidature introuvable."));

        if (u.getRole() == RoleUtilisateur.ENTREPRISE) {
            Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Profil entreprise introuvable."));
            if (!candApp.getOffre().getEntreprise().getId().equals(e.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Vous ne pouvez planifier un entretien que pour vos propres offres.");
            }
        } else if (u.getRole() != RoleUtilisateur.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seule une entreprise peut planifier un entretien.");
        }

        // Automatically move application status to ENTRETIEN if currently waiting/reviewing
        if (candApp.getStatut() == StatutCandidature.EN_ATTENTE || candApp.getStatut() == StatutCandidature.EN_COURS_EXAMEN) {
            candApp.setStatut(StatutCandidature.ENTRETIEN);
            candidatureRepository.save(candApp);
        }

        Entretien entretien = new Entretien();
        entretien.setCandidature(candApp);
        entretien.setDateEntretien(req.dateEntretien());
        entretien.setTypeEntretien(req.typeEntretien() != null ? req.typeEntretien() : "Visioconférence");
        entretien.setLienOuLieu(req.lienOuLieu() != null ? req.lienOuLieu() : "https://meet.talentflow.io/interview-" + candApp.getId());
        entretien.setStatut(StatutEntretien.PLANIFIE);
        entretien.setCommentaire(req.commentaire());

        entretien = entretienRepository.save(entretien);
        return mapper.toEntretienDTO(entretien);
    }

    @PatchMapping("/{id}")
    @Transactional
    public EntretienDTO updateEntretien(@PathVariable Long id, @RequestBody EntretienDTO.UpdateRequest req) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Entretien entretien = entretienRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Entretien introuvable."));

        if (u.getRole() == RoleUtilisateur.ENTREPRISE) {
            Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Profil entreprise introuvable."));
            if (!entretien.getCandidature().getOffre().getEntreprise().getId().equals(e.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Accès refusé.");
            }
        } else if (u.getRole() != RoleUtilisateur.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seule l'entreprise peut modifier l'entretien.");
        }

        if (req.dateEntretien() != null) entretien.setDateEntretien(req.dateEntretien());
        if (req.typeEntretien() != null) entretien.setTypeEntretien(req.typeEntretien());
        if (req.lienOuLieu() != null) entretien.setLienOuLieu(req.lienOuLieu());
        if (req.statut() != null) entretien.setStatut(req.statut());
        if (req.commentaire() != null) entretien.setCommentaire(req.commentaire());

        entretien = entretienRepository.save(entretien);
        return mapper.toEntretienDTO(entretien);
    }
}
