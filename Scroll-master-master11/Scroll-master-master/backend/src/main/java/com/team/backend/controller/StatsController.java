package com.team.backend.controller;

import com.team.backend.dto.DtoMapper;
import com.team.backend.entity.*;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.*;
import com.team.backend.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final UtilisateurRepository utilisateurRepository;
    private final CandidatRepository candidatRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final OffreRepository offreRepository;
    private final CandidatureRepository candidatureRepository;
    private final EntretienRepository entretienRepository;
    private final FavoriRepository favoriRepository;
    private final SecurityUtils securityUtils;
    private final DtoMapper mapper;

    public StatsController(
        UtilisateurRepository utilisateurRepository,
        CandidatRepository candidatRepository,
        EntrepriseRepository entrepriseRepository,
        OffreRepository offreRepository,
        CandidatureRepository candidatureRepository,
        EntretienRepository entretienRepository,
        FavoriRepository favoriRepository,
        SecurityUtils securityUtils,
        DtoMapper mapper
    ) {
        this.utilisateurRepository = utilisateurRepository;
        this.candidatRepository = candidatRepository;
        this.entrepriseRepository = entrepriseRepository;
        this.offreRepository = offreRepository;
        this.candidatureRepository = candidatureRepository;
        this.entretienRepository = entretienRepository;
        this.favoriRepository = favoriRepository;
        this.securityUtils = securityUtils;
        this.mapper = mapper;
    }

    @GetMapping("/public")
    @Transactional(readOnly = true)
    public Map<String, Object> getPublicStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeOffers", offreRepository.countByStatut(StatutOffre.ACTIVE));
        stats.put("totalCompanies", entrepriseRepository.count());
        stats.put("totalCandidates", candidatRepository.count());
        stats.put("totalApplications", candidatureRepository.count());
        return stats;
    }

    @GetMapping("/candidat")
    @Transactional(readOnly = true)
    public Map<String, Object> getCandidatStats() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Candidat c = candidatRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil candidat introuvable."));

        Map<String, Object> stats = new HashMap<>();
        long totalApps = candidatureRepository.countByCandidatId(c.getId());
        long pending = candidatureRepository.countByCandidatIdAndStatut(c.getId(), StatutCandidature.EN_ATTENTE)
            + candidatureRepository.countByCandidatIdAndStatut(c.getId(), StatutCandidature.EN_COURS_EXAMEN);
        long accepted = candidatureRepository.countByCandidatIdAndStatut(c.getId(), StatutCandidature.ACCEPTEE);
        long rejected = candidatureRepository.countByCandidatIdAndStatut(c.getId(), StatutCandidature.REFUSEE);
        long interviews = entretienRepository.countByCandidatureCandidatIdAndStatut(c.getId(), StatutEntretien.PLANIFIE);
        long favorites = favoriRepository.countByCandidatId(c.getId());

        stats.put("totalCandidatures", totalApps);
        stats.put("enAttente", pending);
        stats.put("acceptees", accepted);
        stats.put("refusees", rejected);
        stats.put("entretiensPlanifies", interviews);
        stats.put("favorisCount", favorites);
        stats.put("profileCompletion", mapper.toCandidatDTO(c).completionPercentage());
        return stats;
    }

    @GetMapping("/entreprise")
    @Transactional(readOnly = true)
    public Map<String, Object> getEntrepriseStats() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil entreprise introuvable."));

        Map<String, Object> stats = new HashMap<>();
        long totalOffres = offreRepository.countByEntrepriseId(e.getId());
        long offresActives = offreRepository.countByEntrepriseIdAndStatut(e.getId(), StatutOffre.ACTIVE);
        long totalApps = candidatureRepository.countByOffreEntrepriseId(e.getId());
        long enAttente = candidatureRepository.countByOffreEntrepriseIdAndStatut(e.getId(), StatutCandidature.EN_ATTENTE);
        long enExamen = candidatureRepository.countByOffreEntrepriseIdAndStatut(e.getId(), StatutCandidature.EN_COURS_EXAMEN);
        long acceptees = candidatureRepository.countByOffreEntrepriseIdAndStatut(e.getId(), StatutCandidature.ACCEPTEE);
        long refusees = candidatureRepository.countByOffreEntrepriseIdAndStatut(e.getId(), StatutCandidature.REFUSEE);
        long entretiens = entretienRepository.countByCandidatureOffreEntrepriseIdAndStatut(e.getId(), StatutEntretien.PLANIFIE);

        stats.put("totalOffres", totalOffres);
        stats.put("offresActives", offresActives);
        stats.put("totalCandidatures", totalApps);
        stats.put("candidaturesEnAttente", enAttente + enExamen);
        stats.put("candidaturesAcceptees", acceptees);
        stats.put("candidaturesRefusees", refusees);
        stats.put("entretiensPlanifies", entretiens);

        List<Map<String, Object>> offerPerformance = offreRepository.findByEntrepriseIdOrderByDatePublicationDesc(e.getId())
            .stream()
            .limit(6)
            .map(o -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", o.getTitre().length() > 22 ? o.getTitre().substring(0, 22) + "…" : o.getTitre());
                m.put("candidatures", candidatureRepository.countByOffreId(o.getId()));
                m.put("statut", o.getStatut().name());
                return m;
            })
            .toList();
        stats.put("offerPerformance", offerPerformance);
        return stats;
    }

    @GetMapping("/admin")
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", utilisateurRepository.count());
        stats.put("activeUsers", utilisateurRepository.countByActif(true));
        stats.put("totalCandidats", utilisateurRepository.countByRole(RoleUtilisateur.CANDIDAT));
        stats.put("totalEntreprises", utilisateurRepository.countByRole(RoleUtilisateur.ENTREPRISE));
        stats.put("totalOffres", offreRepository.count());
        stats.put("activeOffres", offreRepository.countByStatut(StatutOffre.ACTIVE));
        stats.put("suspendedOffres", offreRepository.countByStatut(StatutOffre.SUSPENDUE));
        stats.put("totalCandidatures", candidatureRepository.count());
        stats.put("acceptedCandidatures", candidatureRepository.countByStatut(StatutCandidature.ACCEPTEE));
        stats.put("pendingCandidatures", candidatureRepository.countByStatut(StatutCandidature.EN_ATTENTE));
        stats.put("totalEntretiens", entretienRepository.count());
        return stats;
    }
}
