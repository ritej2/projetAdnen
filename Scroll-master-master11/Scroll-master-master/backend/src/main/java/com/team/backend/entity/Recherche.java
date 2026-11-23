package com.team.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recherches")
public class Recherche {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

    @Column(name = "mot_cle", length = 180)
    private String motCle;

    @Column(length = 180)
    private String localisation;

    @Column(name = "type_contrat", length = 80)
    private String typeContrat;

    @Column(length = 100)
    private String categorie;

    @Column(name = "date_recherche", nullable = false)
    private LocalDateTime dateRecherche = LocalDateTime.now();

    public Recherche() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Candidat getCandidat() { return candidat; }
    public void setCandidat(Candidat candidat) { this.candidat = candidat; }

    public String getMotCle() { return motCle; }
    public void setMotCle(String motCle) { this.motCle = motCle; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public String getTypeContrat() { return typeContrat; }
    public void setTypeContrat(String typeContrat) { this.typeContrat = typeContrat; }

    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }

    public LocalDateTime getDateRecherche() { return dateRecherche; }
    public void setDateRecherche(LocalDateTime dateRecherche) { this.dateRecherche = dateRecherche; }
}
