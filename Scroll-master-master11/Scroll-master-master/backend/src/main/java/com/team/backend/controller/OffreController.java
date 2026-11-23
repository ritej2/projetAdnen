package com.team.backend.controller;

import com.team.backend.dto.DtoMapper;
import com.team.backend.dto.OffreDTO;
import com.team.backend.entity.Entreprise;
import com.team.backend.entity.Offre;
import com.team.backend.entity.RoleUtilisateur;
import com.team.backend.entity.StatutOffre;
import com.team.backend.entity.Utilisateur;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.CandidatureRepository;
import com.team.backend.repository.EntrepriseRepository;
import com.team.backend.repository.OffreRepository;
import com.team.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/offres")
public class OffreController {

    private final OffreRepository offreRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final CandidatureRepository candidatureRepository;
    private final SecurityUtils securityUtils;
    private final DtoMapper mapper;

    public OffreController(
        OffreRepository offreRepository,
        EntrepriseRepository entrepriseRepository,
        CandidatureRepository candidatureRepository,
        SecurityUtils securityUtils,
        DtoMapper mapper
    ) {
        this.offreRepository = offreRepository;
        this.entrepriseRepository = entrepriseRepository;
        this.candidatureRepository = candidatureRepository;
        this.securityUtils = securityUtils;
        this.mapper = mapper;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Page<OffreDTO> searchOffres(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String localisation,
        @RequestParam(required = false) String typeContrat,
        @RequestParam(required = false) String categorie,
        @RequestParam(required = false) BigDecimal salaireMin,
        @RequestParam(required = false, defaultValue = "ACTIVE") StatutOffre statut,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "datePublication") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return offreRepository.searchOffres(statut, keyword, localisation, typeContrat, categorie, salaireMin, pageable)
            .map(o -> mapper.toOffreDTO(o, candidatureRepository.countByOffreId(o.getId())));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public OffreDTO getOffreById(@PathVariable Long id) {
        Offre o = offreRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre d'emploi introuvable."));
        return mapper.toOffreDTO(o, candidatureRepository.countByOffreId(o.getId()));
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public List<OffreDTO> getMyCompanyOffres() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Accès réservé aux entreprises."));
        return offreRepository.findByEntrepriseIdOrderByDatePublicationDesc(e.getId()).stream()
            .map(o -> mapper.toOffreDTO(o, candidatureRepository.countByOffreId(o.getId())))
            .toList();
    }

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public OffreDTO createOffre(@Valid @RequestBody OffreDTO.SaveRequest req) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        if (u.getRole() != RoleUtilisateur.ENTREPRISE && u.getRole() != RoleUtilisateur.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seule une entreprise peut publier une offre.");
        }
        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Veuillez d'abord configurer votre profil entreprise."));

        Offre o = new Offre();
        o.setEntreprise(e);
        applyRequestToEntity(req, o);
        o.setDatePublication(LocalDate.now());
        if (o.getStatut() == null) {
            o.setStatut(StatutOffre.ACTIVE);
        }

        o = offreRepository.save(o);
        return mapper.toOffreDTO(o, 0);
    }

    @PutMapping("/{id}")
    @Transactional
    public OffreDTO updateOffre(@PathVariable Long id, @Valid @RequestBody OffreDTO.SaveRequest req) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Offre o = offreRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre introuvable."));

        verifyOfferOwnershipOrAdmin(u, o);
        applyRequestToEntity(req, o);
        o = offreRepository.save(o);
        return mapper.toOffreDTO(o, candidatureRepository.countByOffreId(o.getId()));
    }

    @PatchMapping("/{id}/statut")
    @Transactional
    public OffreDTO updateOffreStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Offre o = offreRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre introuvable."));

        verifyOfferOwnershipOrAdmin(u, o);
        String statutStr = body.get("statut");
        if (statutStr == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le statut est requis.");
        }
        try {
            o.setStatut(StatutOffre.valueOf(statutStr.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Statut d'offre invalide.");
        }
        o = offreRepository.save(o);
        return mapper.toOffreDTO(o, candidatureRepository.countByOffreId(o.getId()));
    }

    @DeleteMapping("/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOffre(@PathVariable Long id) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Offre o = offreRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre introuvable."));
        verifyOfferOwnershipOrAdmin(u, o);
        offreRepository.delete(o);
    }

    private void verifyOfferOwnershipOrAdmin(Utilisateur u, Offre o) {
        if (u.getRole() == RoleUtilisateur.ADMIN) return;
        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Accès refusé."));
        if (!o.getEntreprise().getId().equals(e.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vous ne pouvez modifier que les offres appartenant à votre entreprise.");
        }
    }

    private void applyRequestToEntity(OffreDTO.SaveRequest req, Offre o) {
        o.setTitre(req.titre());
        o.setDescription(req.description());
        o.setMissions(req.missions());
        o.setProfilRecherche(req.profilRecherche());
        o.setLocalisation(req.localisation());
        o.setModeTravail(req.modeTravail() != null && !req.modeTravail().isBlank() ? req.modeTravail() : "Hybride");
        o.setCategorie(req.categorie() != null && !req.categorie().isBlank() ? req.categorie() : "Ingénierie & Tech");
        o.setTypeContrat(req.typeContrat());
        o.setNiveauExperience(req.niveauExperience() != null && !req.niveauExperience().isBlank() ? req.niveauExperience() : "Confirmé");
        o.setCompetencesRequises(req.competencesRequises());
        o.setSalaire(req.salaire());
        o.setSalaireMax(req.salaireMax());
        o.setDateExpiration(req.dateExpiration());
        if (req.statut() != null) {
            o.setStatut(req.statut());
        }
    }
}
