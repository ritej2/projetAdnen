package com.team.backend.dto;

import com.team.backend.entity.StatutOffre;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OffreDTO(
    Long id,
    Long entrepriseId,
    String nomEntreprise,
    String secteurEntreprise,
    String logoEntreprise,
    boolean entrepriseVerifiee,
    String titre,
    String description,
    String missions,
    String profilRecherche,
    String localisation,
    String modeTravail,
    String categorie,
    String typeContrat,
    String niveauExperience,
    String competencesRequises,
    BigDecimal salaire,
    BigDecimal salaireMax,
    LocalDate datePublication,
    LocalDate dateExpiration,
    StatutOffre statut,
    long nombreCandidatures
) {
    public record SaveRequest(
        @NotBlank(message = "Le titre du poste est obligatoire") String titre,
        @NotBlank(message = "La description est obligatoire") String description,
        String missions,
        String profilRecherche,
        @NotBlank(message = "La localisation est obligatoire") String localisation,
        String modeTravail,
        String categorie,
        @NotBlank(message = "Le type de contrat est obligatoire") String typeContrat,
        String niveauExperience,
        String competencesRequises,
        @PositiveOrZero(message = "Le salaire doit être positif") BigDecimal salaire,
        @PositiveOrZero(message = "Le salaire maximum doit être positif") BigDecimal salaireMax,
        LocalDate dateExpiration,
        StatutOffre statut
    ) {}
}
