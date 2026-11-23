package com.team.backend.dto;

import com.team.backend.entity.RoleUtilisateur;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record UtilisateurDTO(
    Long id,
    String firebaseUid,
    String nom,
    String email,
    String telephone,
    RoleUtilisateur role,
    LocalDateTime dateCreation,
    boolean actif,
    Long candidatId,
    Long entrepriseId
) {
    public record SyncRequest(
        String firebaseUid,
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotBlank(message = "L'email est obligatoire") @Email(message = "Email invalide") String email,
        String telephone,
        RoleUtilisateur role,
        String nomEntreprise,
        String secteur,
        String titreProfil,
        String logoUrl,
        String photoUrl
    ) {}

    public record UpdateUserRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        String email,
        String telephone,
        String titreProfil,
        String adresse,
        String competences,
        String bio,
        String nomEntreprise,
        String secteur,
        String siteWeb,
        String description,
        String logoUrl,
        String photoUrl
    ) {}
}
