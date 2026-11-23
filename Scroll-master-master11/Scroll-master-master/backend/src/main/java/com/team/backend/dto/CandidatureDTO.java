package com.team.backend.dto;

import com.team.backend.entity.StatutCandidature;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CandidatureDTO(
    Long id,
    Long candidatId,
    String candidatNom,
    String candidatEmail,
    String candidatTelephone,
    String candidatTitre,
    String candidatCompetences,
    String candidatExperience,
    String candidatFormation,
    String candidatCvUrl,
    Long offreId,
    String offreTitre,
    String offreLocalisation,
    String offreTypeContrat,
    BigDecimal offreSalaire,
    Long entrepriseId,
    String nomEntreprise,
    String logoEntreprise,
    LocalDateTime dateCandidature,
    StatutCandidature statut,
    String lettreMotivation,
    String cvUrlSpecifique,
    String noteRecruteur,
    Integer scoreMatching
) {
    public record CreateRequest(
        @NotNull(message = "L'identifiant de l'offre est obligatoire") Long offreId,
        String lettreMotivation,
        String cvUrlSpecifique
    ) {}

    public record UpdateStatutRequest(
        @NotNull(message = "Le statut est obligatoire") StatutCandidature statut,
        String noteRecruteur
    ) {}
}
