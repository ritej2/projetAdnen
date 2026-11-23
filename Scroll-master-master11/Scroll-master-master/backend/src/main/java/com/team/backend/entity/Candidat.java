package com.team.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "candidats")
public class Candidat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private Utilisateur utilisateur;

    @Column(name = "titre_profil", length = 180)
    private String titreProfil;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 255)
    private String adresse;

    @Column(columnDefinition = "TEXT")
    private String competences;

    @Column(columnDefinition = "TEXT")
    private String formation;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(name = "cv_url", length = 500)
    private String cvUrl;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "portfolio_url", length = 255)
    private String portfolioUrl;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    public Candidat() {}

    public Candidat(Utilisateur utilisateur, String titreProfil, String adresse, String competences) {
        this.utilisateur = utilisateur;
        this.titreProfil = titreProfil;
        this.adresse = adresse;
        this.competences = competences;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }

    public String getTitreProfil() { return titreProfil; }
    public void setTitreProfil(String titreProfil) { this.titreProfil = titreProfil; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getCompetences() { return competences; }
    public void setCompetences(String competences) { this.competences = competences; }

    public String getFormation() { return formation; }
    public void setFormation(String formation) { this.formation = formation; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getCvUrl() { return cvUrl; }
    public void setCvUrl(String cvUrl) { this.cvUrl = cvUrl; }

    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }

    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}
