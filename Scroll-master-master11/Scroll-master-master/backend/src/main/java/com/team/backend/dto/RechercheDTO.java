package com.team.backend.dto;

import java.time.LocalDateTime;

public record RechercheDTO(
    Long id,
    Long candidatId,
    String motCle,
    String localisation,
    String typeContrat,
    String categorie,
    LocalDateTime dateRecherche
) {
    public record CreateRequest(
        String motCle,
        String localisation,
        String typeContrat,
        String categorie
    ) {}
}
