package com.team.backend.controller;

import com.team.backend.dto.DtoMapper;
import com.team.backend.dto.FavoriDTO;
import com.team.backend.dto.RechercheDTO;
import com.team.backend.entity.*;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.*;
import com.team.backend.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
public class FavoriEtRechercheController {

    private final FavoriRepository favoriRepository;
    private final RechercheRepository rechercheRepository;
    private final CandidatRepository candidatRepository;
    private final OffreRepository offreRepository;
    private final CandidatureRepository candidatureRepository;
    private final SecurityUtils securityUtils;
    private final DtoMapper mapper;

    public FavoriEtRechercheController(
        FavoriRepository favoriRepository,
        RechercheRepository rechercheRepository,
        CandidatRepository candidatRepository,
        OffreRepository offreRepository,
        CandidatureRepository candidatureRepository,
        SecurityUtils securityUtils,
        DtoMapper mapper
    ) {
        this.favoriRepository = favoriRepository;
        this.rechercheRepository = rechercheRepository;
        this.candidatRepository = candidatRepository;
        this.offreRepository = offreRepository;
        this.candidatureRepository = candidatureRepository;
        this.securityUtils = securityUtils;
        this.mapper = mapper;
    }

    @GetMapping("/favoris")
    @Transactional(readOnly = true)
    public List<FavoriDTO> getMyFavoris() {
        Candidat c = getCurrentCandidat();
        return favoriRepository.findByCandidatIdOrderByDateAjoutDesc(c.getId()).stream()
            .map(f -> new FavoriDTO(
                f.getId(),
                c.getId(),
                f.getDateAjout(),
                mapper.toOffreDTO(f.getOffre(), candidatureRepository.countByOffreId(f.getOffre().getId()))
            ))
            .toList();
    }

    @PostMapping("/favoris/{offreId}")
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public FavoriDTO addFavori(@PathVariable Long offreId) {
        Candidat c = getCurrentCandidat();
        Offre o = offreRepository.findById(offreId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offre introuvable."));

        Favori f = favoriRepository.findByCandidatIdAndOffreId(c.getId(), offreId)
            .orElseGet(() -> favoriRepository.save(new Favori(c, o)));

        return new FavoriDTO(
            f.getId(),
            c.getId(),
            f.getDateAjout(),
            mapper.toOffreDTO(o, candidatureRepository.countByOffreId(o.getId()))
        );
    }

    @DeleteMapping("/favoris/{offreId}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavori(@PathVariable Long offreId) {
        Candidat c = getCurrentCandidat();
        favoriRepository.deleteByCandidatIdAndOffreId(c.getId(), offreId);
    }

    @GetMapping("/recherches")
    @Transactional(readOnly = true)
    public List<RechercheDTO> getMyRecherches() {
        Candidat c = getCurrentCandidat();
        return rechercheRepository.findByCandidatIdOrderByDateRechercheDesc(c.getId()).stream()
            .map(r -> new RechercheDTO(
                r.getId(),
                c.getId(),
                r.getMotCle(),
                r.getLocalisation(),
                r.getTypeContrat(),
                r.getCategorie(),
                r.getDateRecherche()
            ))
            .toList();
    }

    @PostMapping("/recherches")
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public RechercheDTO saveRecherche(@RequestBody RechercheDTO.CreateRequest req) {
        Candidat c = getCurrentCandidat();
        Recherche r = new Recherche();
        r.setCandidat(c);
        r.setMotCle(req.motCle());
        r.setLocalisation(req.localisation());
        r.setTypeContrat(req.typeContrat());
        r.setCategorie(req.categorie());
        r.setDateRecherche(LocalDateTime.now());
        r = rechercheRepository.save(r);

        return new RechercheDTO(
            r.getId(),
            c.getId(),
            r.getMotCle(),
            r.getLocalisation(),
            r.getTypeContrat(),
            r.getCategorie(),
            r.getDateRecherche()
        );
    }

    @DeleteMapping("/recherches/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRecherche(@PathVariable Long id) {
        Candidat c = getCurrentCandidat();
        Recherche r = rechercheRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Recherche introuvable."));
        if (!r.getCandidat().getId().equals(c.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Accès refusé.");
        }
        rechercheRepository.delete(r);
    }

    private Candidat getCurrentCandidat() {
        Utilisateur u = securityUtils.getCurrentUtilisateur();
        return candidatRepository.findByUtilisateurId(u.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Accès réservé aux candidats."));
    }
}
