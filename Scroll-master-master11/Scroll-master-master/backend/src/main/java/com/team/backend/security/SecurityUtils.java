package com.team.backend.security;

import com.team.backend.entity.Utilisateur;
import com.team.backend.exception.ApiException;
import com.team.backend.repository.UtilisateurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private final UtilisateurRepository utilisateurRepository;

    public SecurityUtils(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    public AuthenticatedUser getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentification requise.");
        }
        return principal;
    }

    public Utilisateur getCurrentUtilisateur() {
        AuthenticatedUser principal = getCurrentPrincipal();
        if (principal.utilisateurId() != null) {
            return utilisateurRepository.findById(principal.utilisateurId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
        }
        return utilisateurRepository.findByFirebaseUid(principal.firebaseUid())
            .orElseGet(() -> utilisateurRepository.findByEmail(principal.email())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil utilisateur non synchronisé.")));
    }
}
