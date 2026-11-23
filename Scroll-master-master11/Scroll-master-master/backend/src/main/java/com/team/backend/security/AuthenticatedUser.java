package com.team.backend.security;

import com.team.backend.entity.RoleUtilisateur;

public record AuthenticatedUser(
    String firebaseUid,
    String email,
    String nom,
    Long utilisateurId,
    RoleUtilisateur role,
    boolean actif
) {}
