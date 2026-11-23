package com.team.backend.controller;

import com.team.backend.dto.DtoMapper;
import com.team.backend.dto.OffreDTO;
import com.team.backend.dto.UtilisateurDTO;
import com.team.backend.entity.*;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UtilisateurRepository utilisateurRepository;
    private final CandidatRepository candidatRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final OffreRepository offreRepository;
    private final CandidatureRepository candidatureRepository;
    private final DtoMapper mapper;
    private final JdbcTemplate jdbcTemplate;

    public AdminController(
        UtilisateurRepository utilisateurRepository,
        CandidatRepository candidatRepository,
        EntrepriseRepository entrepriseRepository,
        OffreRepository offreRepository,
        CandidatureRepository candidatureRepository,
        DtoMapper mapper,
        JdbcTemplate jdbcTemplate
    ) {
        this.utilisateurRepository = utilisateurRepository;
        this.candidatRepository = candidatRepository;
        this.entrepriseRepository = entrepriseRepository;
        this.offreRepository = offreRepository;
        this.candidatureRepository = candidatureRepository;
        this.mapper = mapper;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public Page<UtilisateurDTO> searchUsers(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) RoleUtilisateur role,
        @RequestParam(required = false) Boolean actif,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return utilisateurRepository.searchUsers(search, role, actif, pageable)
            .map(u -> {
                Long cId = candidatRepository.findByUtilisateurId(u.getId()).map(Candidat::getId).orElse(null);
                Long eId = entrepriseRepository.findByUtilisateurId(u.getId()).map(Entreprise::getId).orElse(null);
                return mapper.toUtilisateurDTO(u, cId, eId);
            });
    }

    @PatchMapping("/users/{id}/status")
    @Transactional
    public UtilisateurDTO toggleUserActiveStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Utilisateur u = utilisateurRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
        Boolean actif = body.get("actif");
        if (actif == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le champ 'actif' est obligatoire.");
        }
        u.setActif(actif);
        u = utilisateurRepository.save(u);
        Long cId = candidatRepository.findByUtilisateurId(u.getId()).map(Candidat::getId).orElse(null);
        Long eId = entrepriseRepository.findByUtilisateurId(u.getId()).map(Entreprise::getId).orElse(null);
        return mapper.toUtilisateurDTO(u, cId, eId);
    }

    @PutMapping("/users/{id}")
    @Transactional
    public UtilisateurDTO updateAnyUserProfile(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Utilisateur u = utilisateurRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));

        if (body.get("nom") != null && !String.valueOf(body.get("nom")).isBlank()) {
            u.setNom(String.valueOf(body.get("nom")).trim());
        }
        if (body.get("email") != null && !String.valueOf(body.get("email")).isBlank()) {
            u.setEmail(String.valueOf(body.get("email")).trim().toLowerCase());
        }
        if (body.get("telephone") != null) {
            u.setTelephone(String.valueOf(body.get("telephone")).trim());
        }
        if (body.get("role") != null) {
            try {
                u.setRole(RoleUtilisateur.valueOf(String.valueOf(body.get("role")).toUpperCase()));
            } catch (Exception ignored) {
            }
        }
        if (body.get("actif") != null) {
            u.setActif(Boolean.parseBoolean(String.valueOf(body.get("actif"))));
        }

        u = utilisateurRepository.save(u);
        Long cId = candidatRepository.findByUtilisateurId(u.getId()).map(Candidat::getId).orElse(null);
        Long eId = entrepriseRepository.findByUtilisateurId(u.getId()).map(Entreprise::getId).orElse(null);
        return mapper.toUtilisateurDTO(u, cId, eId);
    }

    @GetMapping("/offres")
    @Transactional(readOnly = true)
    public List<OffreDTO> getAllOffresForModeration() {
        return offreRepository.findAll().stream()
            .map(o -> mapper.toOffreDTO(o, candidatureRepository.countByOffreId(o.getId())))
            .toList();
    }

    @PatchMapping("/offres/{id}/statut")
    @Transactional
    public OffreDTO moderateOffreStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Offre o = offreRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre introuvable."));
        String statutStr = body.get("statut");
        if (statutStr == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le champ 'statut' est obligatoire.");
        }
        o.setStatut(StatutOffre.valueOf(statutStr.toUpperCase()));
        o = offreRepository.save(o);
        return mapper.toOffreDTO(o, candidatureRepository.countByOffreId(o.getId()));
    }

    @DeleteMapping("/offres/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInappropriateOffre(@PathVariable Long id) {
        Offre o = offreRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre introuvable."));
        offreRepository.delete(o);
    }

    @PatchMapping("/reports/{id}/status")
    @Transactional
    public Map<String, Object> updateReportStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "REVIEWED");
        jdbcTemplate.update("UPDATE job_offer_reports SET status = ? WHERE id = ?", status, id);
        return Map.of("id", id, "status", status);
    }

    @PatchMapping("/notifications/{id}/read")
    @Transactional
    public Map<String, Object> markNotificationRead(@PathVariable Long id) {
        jdbcTemplate.update("UPDATE notifications SET is_read = TRUE WHERE id = ?", id);
        return Map.of("id", id, "is_read", true);
    }
}
