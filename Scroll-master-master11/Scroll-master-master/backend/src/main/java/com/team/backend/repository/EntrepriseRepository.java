package com.team.backend.repository;

import com.team.backend.entity.Entreprise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EntrepriseRepository extends JpaRepository<Entreprise, Long> {
    Optional<Entreprise> findByUtilisateurId(Long utilisateurId);
    Optional<Entreprise> findByUtilisateurFirebaseUid(String firebaseUid);
}
