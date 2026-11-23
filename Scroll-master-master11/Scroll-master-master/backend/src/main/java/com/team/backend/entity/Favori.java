package com.team.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "favoris",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_favori_candidat_offre", columnNames = {"candidat_id", "offre_id"})
    }
)
public class Favori {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "offre_id", nullable = false)
    private Offre offre;

    @Column(name = "date_ajout", nullable = false)
    private LocalDateTime dateAjout = LocalDateTime.now();

    public Favori() {}

    public Favori(Candidat candidat, Offre offre) {
        this.candidat = candidat;
        this.offre = offre;
        this.dateAjout = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Candidat getCandidat() { return candidat; }
    public void setCandidat(Candidat candidat) { this.candidat = candidat; }

    public Offre getOffre() { return offre; }
    public void setOffre(Offre offre) { this.offre = offre; }

    public LocalDateTime getDateAjout() { return dateAjout; }
    public void setDateAjout(LocalDateTime dateAjout) { this.dateAjout = dateAjout; }
}
