package com.team.backend.dto;

import com.team.backend.entity.StatutEntretien;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record EntretienDTO(
    Long id,
    Long candidatureId,
    Long offreId,
    String offreTitre,
    Long candidatId,
    String candidatNom,
    String candidatEmail,
    Long entrepriseId,
    String nomEntreprise,
    LocalDateTime dateEntretien,
    String typeEntretien,
    String lienOuLieu,
    StatutEntretien statut,
    String commentaire
) {
    public record CreateRequest(
        @NotNull(message = "L'identifiant de la candidature est obligatoire") Long candidatureId,
        @NotNull(message = "La date de l'entretien est obligatoire") LocalDateTime dateEntretien,
        String typeEntretien,
        String lienOuLieu,
        String commentaire
    ) {}

    public record UpdateRequest(
        LocalDateTime dateEntretien,
        String typeEntretien,
        String lienOuLieu,
        StatutEntretien statut,
        String commentaire
    ) {}
}
