package com.team.backend.controller;

import com.team.backend.dto.CandidatDTO;
import com.team.backend.dto.DtoMapper;
import com.team.backend.entity.Candidat;
import com.team.backend.entity.RoleUtilisateur;
import com.team.backend.entity.Utilisateur;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.CandidatRepository;
import com.team.backend.repository.UtilisateurRepository;
import com.team.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/candidats")
public class CandidatController {

    private final CandidatRepository candidatRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final SecurityUtils securityUtils;
    private final DtoMapper mapper;

    public CandidatController(
        CandidatRepository candidatRepository,
        UtilisateurRepository utilisateurRepository,
        SecurityUtils securityUtils,
        DtoMapper mapper
    ) {
        this.candidatRepository = candidatRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.securityUtils = securityUtils;
        this.mapper = mapper;
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public CandidatDTO getMyProfile() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Candidat c = candidatRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil candidat introuvable."));
        return mapper.toCandidatDTO(c);
    }

    @PutMapping("/me")
    @Transactional
    public CandidatDTO updateMyProfile(@Valid @RequestBody CandidatDTO.UpdateRequest req) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        if (u.getRole() != RoleUtilisateur.CANDIDAT && u.getRole() != RoleUtilisateur.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seul un candidat peut modifier ce profil.");
        }

        u.setNom(req.nom());
        u.setTelephone(req.telephone());
        utilisateurRepository.save(u);

        Candidat c = candidatRepository.findByUtilisateurId(u.getId())
            .orElseGet(() -> new Candidat(u, req.titreProfil(), req.adresse(), req.competences()));

        c.setTitreProfil(req.titreProfil());
        c.setBio(req.bio());
        c.setAdresse(req.adresse());
        c.setCompetences(req.competences());
        c.setFormation(req.formation());
        c.setExperience(req.experience());
        if (req.cvUrl() != null && !req.cvUrl().isBlank()) {
            c.setCvUrl(req.cvUrl());
        }
        c.setLinkedinUrl(req.linkedinUrl());
        c.setPortfolioUrl(req.portfolioUrl());

        c = candidatRepository.save(c);
        return mapper.toCandidatDTO(c);
    }

    @PatchMapping("/me/cv")
    @Transactional
    public CandidatDTO updateMyCv(@RequestBody Map<String, String> body) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Candidat c = candidatRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil candidat introuvable."));
        String cvUrl = body.get("cvUrl");
        if (cvUrl == null || cvUrl.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "L'URL du CV est obligatoire.");
        }
        c.setCvUrl(cvUrl);
        c = candidatRepository.save(c);
        return mapper.toCandidatDTO(c);
    }

    @PatchMapping("/me/photo")
    @Transactional
    public CandidatDTO updateMyPhoto(@RequestBody Map<String, String> body) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Candidat c = candidatRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil candidat introuvable."));
        String photoUrl = body.get("photoUrl");
        c.setPhotoUrl(photoUrl);
        c = candidatRepository.save(c);
        return mapper.toCandidatDTO(c);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public CandidatDTO getCandidatById(@PathVariable Long id) {
        Candidat c = candidatRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Candidat introuvable."));
        return mapper.toCandidatDTO(c);
    }
}
