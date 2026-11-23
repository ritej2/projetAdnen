package com.team.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CandidatDTO(
    Long id,
    Long utilisateurId,
    String nom,
    String email,
    String telephone,
    String titreProfil,
    String bio,
    String adresse,
    String competences,
    String formation,
    String experience,
    String cvUrl,
    String linkedinUrl,
    String portfolioUrl,
    String photoUrl,
    int completionPercentage
) {
    public record UpdateRequest(
        @NotBlank(message = "Le nom complet est obligatoire") String nom,
        String telephone,
        String titreProfil,
        String bio,
        String adresse,
        String competences,
        String formation,
        String experience,
        String cvUrl,
        String linkedinUrl,
        String portfolioUrl,
        String photoUrl
    ) {}
}
