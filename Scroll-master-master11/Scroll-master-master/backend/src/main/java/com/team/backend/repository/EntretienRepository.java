package com.team.backend.repository;

import com.team.backend.entity.Entretien;
import com.team.backend.entity.StatutEntretien;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EntretienRepository extends JpaRepository<Entretien, Long> {
    List<Entretien> findByCandidatureIdOrderByDateEntretienAsc(Long candidatureId);
    List<Entretien> findByCandidatureCandidatIdOrderByDateEntretienAsc(Long candidatId);
    List<Entretien> findByCandidatureOffreEntrepriseIdOrderByDateEntretienAsc(Long entrepriseId);
    long countByCandidatureCandidatIdAndStatut(Long candidatId, StatutEntretien statut);
    long countByCandidatureOffreEntrepriseIdAndStatut(Long entrepriseId, StatutEntretien statut);
}
