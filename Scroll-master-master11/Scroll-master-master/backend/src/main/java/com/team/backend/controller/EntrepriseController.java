package com.team.backend.controller;

import com.team.backend.dto.DtoMapper;
import com.team.backend.dto.EntrepriseDTO;
import com.team.backend.entity.Entreprise;
import com.team.backend.entity.RoleUtilisateur;
import com.team.backend.entity.StatutOffre;
import com.team.backend.entity.Utilisateur;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.EntrepriseRepository;
import com.team.backend.repository.OffreRepository;
import com.team.backend.repository.UtilisateurRepository;
import com.team.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entreprises")
public class EntrepriseController {

    private final EntrepriseRepository entrepriseRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final OffreRepository offreRepository;
    private final SecurityUtils securityUtils;
    private final DtoMapper mapper;

    public EntrepriseController(
        EntrepriseRepository entrepriseRepository,
        UtilisateurRepository utilisateurRepository,
        OffreRepository offreRepository,
        SecurityUtils securityUtils,
        DtoMapper mapper
    ) {
        this.entrepriseRepository = entrepriseRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.offreRepository = offreRepository;
        this.securityUtils = securityUtils;
        this.mapper = mapper;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<EntrepriseDTO> getAllEntreprises() {
        return entrepriseRepository.findAll().stream()
            .map(e -> mapper.toEntrepriseDTO(e, offreRepository.countByEntrepriseIdAndStatut(e.getId(), StatutOffre.ACTIVE)))
            .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public EntrepriseDTO getEntrepriseById(@PathVariable Long id) {
        Entreprise e = entrepriseRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Entreprise introuvable."));
        long activeCount = offreRepository.countByEntrepriseIdAndStatut(e.getId(), StatutOffre.ACTIVE);
        return mapper.toEntrepriseDTO(e, activeCount);
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public EntrepriseDTO getMyEntreprise() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil entreprise introuvable."));
        long activeCount = offreRepository.countByEntrepriseIdAndStatut(e.getId(), StatutOffre.ACTIVE);
        return mapper.toEntrepriseDTO(e, activeCount);
    }

    @PutMapping("/me")
    @Transactional
    public EntrepriseDTO updateMyEntreprise(@Valid @RequestBody EntrepriseDTO.UpdateRequest req) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        if (u.getRole() != RoleUtilisateur.ENTREPRISE && u.getRole() != RoleUtilisateur.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seul un compte entreprise peut modifier ce profil.");
        }

        if (req.nomContact() != null && !req.nomContact().isBlank()) {
            u.setNom(req.nomContact());
        }
        if (req.telephone() != null) {
            u.setTelephone(req.telephone());
        }
        utilisateurRepository.save(u);

        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
            .orElseGet(() -> new Entreprise(u, req.nomEntreprise(), req.secteur(), req.description(), req.adresse()));

        e.setNomEntreprise(req.nomEntreprise());
        e.setSecteur(req.secteur());
        e.setDescription(req.description());
        e.setAdresse(req.adresse());
        e.setSiteWeb(req.siteWeb());
        e.setTailleEntreprise(req.tailleEntreprise());
        if (req.logoUrl() != null && !req.logoUrl().isBlank()) {
            e.setLogoUrl(req.logoUrl());
        }

        e = entrepriseRepository.save(e);
        long activeCount = offreRepository.countByEntrepriseIdAndStatut(e.getId(), StatutOffre.ACTIVE);
        return mapper.toEntrepriseDTO(e, activeCount);
    }

    @PatchMapping("/me/logo")
    @Transactional
    public EntrepriseDTO updateLogo(@RequestBody Map<String, String> body) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil entreprise introuvable."));
        String logoUrl = body.get("logoUrl");
        if (logoUrl == null || logoUrl.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "L'URL du logo est obligatoire.");
        }
        e.setLogoUrl(logoUrl);
        e = entrepriseRepository.save(e);
        long activeCount = offreRepository.countByEntrepriseIdAndStatut(e.getId(), StatutOffre.ACTIVE);
        return mapper.toEntrepriseDTO(e, activeCount);
    }
}
