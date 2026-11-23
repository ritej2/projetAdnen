package com.team.backend.repository;

import com.team.backend.entity.PassageTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PassageTestRepository extends JpaRepository<PassageTest, Long> {
    boolean existsByTestIdAndCandidatureId(Long testId, Long candidatureId);
    Optional<PassageTest> findByTestIdAndCandidatureId(Long testId, Long candidatureId);
    List<PassageTest> findByCandidatureIdOrderByDatePassageDesc(Long candidatureId);
    List<PassageTest> findByTestId(Long testId);
    List<PassageTest> findByTestOffreEntrepriseIdOrderByDatePassageDesc(Long entrepriseId);
    long countByTestId(Long testId);
}

