package com.team.backend.repository;

import com.team.backend.entity.Favori;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriRepository extends JpaRepository<Favori, Long> {
    List<Favori> findByCandidatIdOrderByDateAjoutDesc(Long candidatId);
    Optional<Favori> findByCandidatIdAndOffreId(Long candidatId, Long offreId);
    boolean existsByCandidatIdAndOffreId(Long candidatId, Long offreId);
    void deleteByCandidatIdAndOffreId(Long candidatId, Long offreId);
    long countByCandidatId(Long candidatId);
}
