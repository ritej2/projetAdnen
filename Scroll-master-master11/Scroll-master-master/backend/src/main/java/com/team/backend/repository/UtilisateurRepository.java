package com.team.backend.repository;

import com.team.backend.entity.RoleUtilisateur;
import com.team.backend.entity.Utilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByFirebaseUid(String firebaseUid);
    Optional<Utilisateur> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByFirebaseUid(String firebaseUid);
    long countByRole(RoleUtilisateur role);
    long countByActif(boolean actif);

    @Query("""
        SELECT u FROM Utilisateur u
        WHERE (:search IS NULL OR :search = ''
            OR LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:role IS NULL OR u.role = :role)
          AND (:actif IS NULL OR u.actif = :actif)
        ORDER BY u.dateCreation DESC
    """)
    Page<Utilisateur> searchUsers(
        @Param("search") String search,
        @Param("role") RoleUtilisateur role,
        @Param("actif") Boolean actif,
        Pageable pageable
    );
}
