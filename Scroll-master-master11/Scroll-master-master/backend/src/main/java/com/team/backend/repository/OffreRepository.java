package com.team.backend.repository;

import com.team.backend.entity.Offre;
import com.team.backend.entity.StatutOffre;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface OffreRepository extends JpaRepository<Offre, Long> {
    List<Offre> findByEntrepriseIdOrderByDatePublicationDesc(Long entrepriseId);
    long countByEntrepriseId(Long entrepriseId);
    long countByEntrepriseIdAndStatut(Long entrepriseId, StatutOffre statut);
    long countByStatut(StatutOffre statut);

    @Query("""
        SELECT o FROM Offre o
        WHERE (:statut IS NULL OR o.statut = :statut)
          AND (:keyword IS NULL OR :keyword = ''
            OR LOWER(o.titre) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(o.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(o.competencesRequises) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(o.entreprise.nomEntreprise) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:localisation IS NULL OR :localisation = ''
            OR LOWER(o.localisation) LIKE LOWER(CONCAT('%', :localisation, '%')))
          AND (:typeContrat IS NULL OR :typeContrat = ''
            OR LOWER(o.typeContrat) = LOWER(:typeContrat))
          AND (:categorie IS NULL OR :categorie = ''
            OR LOWER(o.categorie) = LOWER(:categorie))
          AND (:salaireMin IS NULL OR o.salaire >= :salaireMin)
    """)
    Page<Offre> searchOffres(
        @Param("statut") StatutOffre statut,
        @Param("keyword") String keyword,
        @Param("localisation") String localisation,
        @Param("typeContrat") String typeContrat,
        @Param("categorie") String categorie,
        @Param("salaireMin") BigDecimal salaireMin,
        Pageable pageable
    );
}
