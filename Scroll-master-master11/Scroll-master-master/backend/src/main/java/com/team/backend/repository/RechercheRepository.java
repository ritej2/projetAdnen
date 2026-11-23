package com.team.backend.repository;

import com.team.backend.entity.Recherche;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RechercheRepository extends JpaRepository<Recherche, Long> {
    List<Recherche> findByCandidatIdOrderByDateRechercheDesc(Long candidatId);
}
