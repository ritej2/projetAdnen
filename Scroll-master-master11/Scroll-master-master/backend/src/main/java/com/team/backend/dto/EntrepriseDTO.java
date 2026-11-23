package com.team.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record EntrepriseDTO(
    Long id,
    Long utilisateurId,
    String nomContact,
    String email,
    String telephone,
    String nomEntreprise,
    String secteur,
    String description,
    String adresse,
    String siteWeb,
    String tailleEntreprise,
    String logoUrl,
    boolean verifiee,
    long nombreOffresActives
) {
    public record UpdateRequest(
        @NotBlank(message = "Le nom de l'entreprise est obligatoire") String nomEntreprise,
        String nomContact,
        String telephone,
        String secteur,
        String description,
        String adresse,
        String siteWeb,
        String tailleEntreprise,
        String logoUrl
    ) {}
}
