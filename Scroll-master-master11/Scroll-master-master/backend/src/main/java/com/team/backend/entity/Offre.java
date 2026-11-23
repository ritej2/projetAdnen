package com.team.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "offres")
public class Offre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String missions;

    @Column(name = "profil_recherche", columnDefinition = "TEXT")
    private String profilRecherche;

    @Column(nullable = false, length = 180)
    private String localisation;

    @Column(name = "mode_travail", length = 60)
    private String modeTravail = "Hybride";

    @Column(length = 100)
    private String categorie = "Ingénierie & Tech";

    @Column(name = "type_contrat", nullable = false, length = 60)
    private String typeContrat;

    @Column(name = "niveau_experience", length = 80)
    private String niveauExperience = "Confirmé";

    @Column(name = "competences_requises", columnDefinition = "TEXT")
    private String competencesRequises;

    @Column(precision = 12, scale = 2)
    private BigDecimal salaire;

    @Column(name = "salaire_max", precision = 12, scale = 2)
    private BigDecimal salaireMax;

    @Column(name = "date_publication", nullable = false)
    private LocalDate datePublication = LocalDate.now();

    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatutOffre statut = StatutOffre.ACTIVE;

    public Offre() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Entreprise getEntreprise() { return entreprise; }
    public void setEntreprise(Entreprise entreprise) { this.entreprise = entreprise; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMissions() { return missions; }
    public void setMissions(String missions) { this.missions = missions; }

    public String getProfilRecherche() { return profilRecherche; }
    public void setProfilRecherche(String profilRecherche) { this.profilRecherche = profilRecherche; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public String getModeTravail() { return modeTravail; }
    public void setModeTravail(String modeTravail) { this.modeTravail = modeTravail; }

    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }

    public String getTypeContrat() { return typeContrat; }
    public void setTypeContrat(String typeContrat) { this.typeContrat = typeContrat; }

    public String getNiveauExperience() { return niveauExperience; }
    public void setNiveauExperience(String niveauExperience) { this.niveauExperience = niveauExperience; }

    public String getCompetencesRequises() { return competencesRequises; }
    public void setCompetencesRequises(String competencesRequises) { this.competencesRequises = competencesRequises; }

    public BigDecimal getSalaire() { return salaire; }
    public void setSalaire(BigDecimal salaire) { this.salaire = salaire; }

    public BigDecimal getSalaireMax() { return salaireMax; }
    public void setSalaireMax(BigDecimal salaireMax) { this.salaireMax = salaireMax; }

    public LocalDate getDatePublication() { return datePublication; }
    public void setDatePublication(LocalDate datePublication) { this.datePublication = datePublication; }

    public LocalDate getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDate dateExpiration) { this.dateExpiration = dateExpiration; }

    public StatutOffre getStatut() { return statut; }
    public void setStatut(StatutOffre statut) { this.statut = statut; }
}
