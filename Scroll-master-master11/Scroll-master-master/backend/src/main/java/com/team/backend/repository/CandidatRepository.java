package com.team.backend.repository;

import com.team.backend.entity.Candidat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CandidatRepository extends JpaRepository<Candidat, Long> {
    Optional<Candidat> findByUtilisateurId(Long utilisateurId);
    Optional<Candidat> findByUtilisateurFirebaseUid(String firebaseUid);
}
