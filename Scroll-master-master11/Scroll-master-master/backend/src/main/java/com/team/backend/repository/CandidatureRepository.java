package com.team.backend.repository;

import com.team.backend.entity.Candidature;
import com.team.backend.entity.StatutCandidature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    boolean existsByCandidatIdAndOffreId(Long candidatId, Long offreId);
    Optional<Candidature> findByCandidatIdAndOffreId(Long candidatId, Long offreId);
    List<Candidature> findByCandidatIdOrderByDateCandidatureDesc(Long candidatId);
    List<Candidature> findByOffreIdOrderByDateCandidatureDesc(Long offreId);
    List<Candidature> findByOffreEntrepriseIdOrderByDateCandidatureDesc(Long entrepriseId);
    long countByOffreId(Long offreId);
    long countByCandidatId(Long candidatId);
    long countByCandidatIdAndStatut(Long candidatId, StatutCandidature statut);
    long countByOffreEntrepriseId(Long entrepriseId);
    long countByOffreEntrepriseIdAndStatut(Long entrepriseId, StatutCandidature statut);
    long countByStatut(StatutCandidature statut);
}
