package com.team.backend.repository;

import com.team.backend.entity.EvaluationIA;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EvaluationIARepository extends JpaRepository<EvaluationIA, Long> {
    Optional<EvaluationIA> findByCandidatureId(Long candidatureId);
    List<EvaluationIA> findByCandidatureOffreEntrepriseId(Long entrepriseId);
    List<EvaluationIA> findByCandidatureCandidatId(Long candidatId);
}

