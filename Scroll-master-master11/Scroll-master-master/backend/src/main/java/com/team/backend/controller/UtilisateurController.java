package com.team.backend.controller;

import com.team.backend.dto.CandidatDTO;
import com.team.backend.dto.DtoMapper;
import com.team.backend.dto.EntrepriseDTO;
import com.team.backend.dto.UtilisateurDTO;
import com.team.backend.entity.Candidat;
import com.team.backend.entity.Entreprise;
import com.team.backend.entity.RoleUtilisateur;
import com.team.backend.entity.StatutOffre;
import com.team.backend.entity.Utilisateur;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.CandidatRepository;
import com.team.backend.repository.EntrepriseRepository;
import com.team.backend.repository.OffreRepository;
import com.team.backend.repository.UtilisateurRepository;
import com.team.backend.security.AuthenticatedUser;
import com.team.backend.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UtilisateurController {

    private final UtilisateurRepository utilisateurRepository;
    private final CandidatRepository candidatRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final OffreRepository offreRepository;
    private final SecurityUtils securityUtils;
    private final DtoMapper mapper;

    public UtilisateurController(
        UtilisateurRepository utilisateurRepository,
        CandidatRepository candidatRepository,
        EntrepriseRepository entrepriseRepository,
        OffreRepository offreRepository,
        SecurityUtils securityUtils,
        DtoMapper mapper
    ) {
        this.utilisateurRepository = utilisateurRepository;
        this.candidatRepository = candidatRepository;
        this.entrepriseRepository = entrepriseRepository;
        this.offreRepository = offreRepository;
        this.securityUtils = securityUtils;
        this.mapper = mapper;
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentUserProfile() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        return buildUserResponse(u);
    }

    @PostMapping("/sync")
    @Transactional
    public Map<String, Object> syncUser(@Valid @RequestBody UtilisateurDTO.SyncRequest req) {
        AuthenticatedUser principal = null;
        try {
            principal = securityUtils.getCurrentPrincipal();
        } catch (Exception ignored) {}

        String uid = (req.firebaseUid() != null && !req.firebaseUid().isBlank())
            ? req.firebaseUid()
            : (principal != null && principal.firebaseUid() != null
                ? principal.firebaseUid()
                : "uid-" + req.email().replaceAll("[^a-zA-Z0-9]", "-") + "-" + (System.currentTimeMillis() % 100000));

        Optional<Utilisateur> existing = utilisateurRepository.findByFirebaseUid(uid);
        if (existing.isEmpty()) {
            existing = utilisateurRepository.findByEmail(req.email());
        }

        Utilisateur u;
        if (existing.isPresent()) {
            u = existing.get();
            if (!u.isActif()) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Votre compte a été désactivé par l'administrateur.");
            }
            u.setFirebaseUid(uid);
            if (req.nom() != null && !req.nom().isBlank()) {
                u.setNom(req.nom());
            }
            if (req.telephone() != null && !req.telephone().isBlank()) {
                u.setTelephone(req.telephone());
            }
            u = utilisateurRepository.save(u);
        } else {
            // Never allow self-assigning ADMIN from frontend registration
            RoleUtilisateur assignedRole = (req.role() == RoleUtilisateur.ENTREPRISE)
                ? RoleUtilisateur.ENTREPRISE
                : RoleUtilisateur.CANDIDAT;

            u = new Utilisateur(uid, req.nom(), req.email(), req.telephone(), assignedRole);
            u = utilisateurRepository.save(u);

            if (assignedRole == RoleUtilisateur.CANDIDAT) {
                Candidat c = new Candidat(
                    u,
                    req.titreProfil() != null && !req.titreProfil().isBlank() ? req.titreProfil() : "Candidat TalentFlow",
                    "Paris, France",
                    "React, TypeScript, Java"
                );
                if (req.photoUrl() != null && !req.photoUrl().isBlank()) {
                    c.setPhotoUrl(req.photoUrl());
                }
                candidatRepository.save(c);
            } else {
                String companyName = (req.nomEntreprise() != null && !req.nomEntreprise().isBlank())
                    ? req.nomEntreprise()
                    : req.nom();
                Entreprise e = new Entreprise(
                    u,
                    companyName,
                    req.secteur() != null ? req.secteur() : "Technologie & SaaS",
                    "Entreprise partenaire sur TalentFlow.",
                    "Paris, France"
                );
                if (req.logoUrl() != null && !req.logoUrl().isBlank()) {
                    e.setLogoUrl(req.logoUrl());
                }
                entrepriseRepository.save(e);
            }
        }

        // Ensure role profile record exists and update photo / logo if provided
        final Utilisateur targetUser = u;
        if (targetUser.getRole() == RoleUtilisateur.CANDIDAT) {
            Candidat c = candidatRepository.findByUtilisateurId(targetUser.getId()).orElseGet(() -> {
                Candidat newC = new Candidat(targetUser, "Profil Candidat", "France", "");
                return candidatRepository.save(newC);
            });
            if (req.photoUrl() != null && !req.photoUrl().isBlank()) {
                c.setPhotoUrl(req.photoUrl());
                candidatRepository.save(c);
            }
        } else if (targetUser.getRole() == RoleUtilisateur.ENTREPRISE) {
            Entreprise e = entrepriseRepository.findByUtilisateurId(targetUser.getId()).orElseGet(() -> {
                Entreprise newE = new Entreprise(targetUser, targetUser.getNom(), "Technologie", "", "France");
                return entrepriseRepository.save(newE);
            });
            if (req.logoUrl() != null && !req.logoUrl().isBlank()) {
                e.setLogoUrl(req.logoUrl());
                entrepriseRepository.save(e);
            }
        }

        return buildUserResponse(targetUser);
    }

    @PostMapping("/register")
    @Transactional
    public Map<String, Object> registerUser(@Valid @RequestBody UtilisateurDTO.SyncRequest req) {
        return syncUser(req);
    }

    @PutMapping("/me")
    @Transactional
    public Map<String, Object> updateMe(@Valid @RequestBody UtilisateurDTO.UpdateUserRequest req) {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        u.setNom(req.nom());
        if (req.email() != null && !req.email().isBlank() && !req.email().equalsIgnoreCase(u.getEmail())) {
            Optional<Utilisateur> other = utilisateurRepository.findByEmail(req.email().trim().toLowerCase());
            if (other.isEmpty() || other.get().getId().equals(u.getId())) {
                u.setEmail(req.email().trim().toLowerCase());
            }
        }
        if (req.telephone() != null) {
            u.setTelephone(req.telephone());
        }
        final Utilisateur savedUser = utilisateurRepository.save(u);

        if (savedUser.getRole() == RoleUtilisateur.CANDIDAT) {
            Candidat c = candidatRepository.findByUtilisateurId(savedUser.getId())
                .orElseGet(() -> new Candidat(savedUser, "Ingénieur Logiciel", "Paris, France", "Java, React"));
            if (req.titreProfil() != null && !req.titreProfil().isBlank()) c.setTitreProfil(req.titreProfil());
            if (req.adresse() != null && !req.adresse().isBlank()) c.setAdresse(req.adresse());
            if (req.competences() != null && !req.competences().isBlank()) c.setCompetences(req.competences());
            if (req.bio() != null && !req.bio().isBlank()) c.setBio(req.bio());
            if (req.photoUrl() != null && !req.photoUrl().isBlank()) c.setPhotoUrl(req.photoUrl());
            candidatRepository.save(c);
        } else if (savedUser.getRole() == RoleUtilisateur.ENTREPRISE) {
            Entreprise e = entrepriseRepository.findByUtilisateurId(savedUser.getId())
                .orElseGet(() -> new Entreprise(savedUser, savedUser.getNom(), "Technologie & Cloud", "", "Paris, France"));
            if (req.nomEntreprise() != null && !req.nomEntreprise().isBlank()) e.setNomEntreprise(req.nomEntreprise());
            if (req.secteur() != null && !req.secteur().isBlank()) e.setSecteur(req.secteur());
            if (req.adresse() != null && !req.adresse().isBlank()) e.setAdresse(req.adresse());
            if (req.siteWeb() != null && !req.siteWeb().isBlank()) e.setSiteWeb(req.siteWeb());
            if (req.description() != null && !req.description().isBlank()) e.setDescription(req.description());
            if (req.logoUrl() != null && !req.logoUrl().isBlank()) e.setLogoUrl(req.logoUrl());
            entrepriseRepository.save(e);
        }

        return buildUserResponse(savedUser);
    }

    private Map<String, Object> buildUserResponse(Utilisateur u) {
        Map<String, Object> result = new HashMap<>();
        Candidat c = candidatRepository.findByUtilisateurId(u.getId()).orElse(null);
        Entreprise e = entrepriseRepository.findByUtilisateurId(u.getId()).orElse(null);

        UtilisateurDTO userDto = mapper.toUtilisateurDTO(
            u,
            c != null ? c.getId() : null,
            e != null ? e.getId() : null
        );
        result.put("user", userDto);

        if (c != null) {
            CandidatDTO candidatDto = mapper.toCandidatDTO(c);
            result.put("candidat", candidatDto);
        }
        if (e != null) {
            long activeOffers = offreRepository.countByEntrepriseIdAndStatut(e.getId(), StatutOffre.ACTIVE);
            EntrepriseDTO entrepriseDto = mapper.toEntrepriseDTO(e, activeOffers);
            result.put("entreprise", entrepriseDto);
        }
        return result;
    }
}
