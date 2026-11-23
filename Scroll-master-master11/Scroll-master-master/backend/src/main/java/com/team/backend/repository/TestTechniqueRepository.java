package com.team.backend.repository;

import com.team.backend.entity.TestTechnique;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestTechniqueRepository extends JpaRepository<TestTechnique, Long> {
    List<TestTechnique> findByOffreIdOrderByDateCreationDesc(Long offreId);
    List<TestTechnique> findByOffreIdAndPublieTrueOrderByDateCreationDesc(Long offreId);
    List<TestTechnique> findByOffreEntrepriseIdOrderByDateCreationDesc(Long entrepriseId);
}

