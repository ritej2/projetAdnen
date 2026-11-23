package com.team.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "entreprises")
public class Entreprise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private Utilisateur utilisateur;

    @Column(name = "nom_entreprise", nullable = false, length = 180)
    private String nomEntreprise;

    @Column(length = 120)
    private String secteur;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String adresse;

    @Column(name = "site_web", length = 255)
    private String siteWeb;

    @Column(name = "taille_entreprise", length = 80)
    private String tailleEntreprise;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(nullable = false)
    private boolean verifiee = true;

    public Entreprise() {}

    public Entreprise(Utilisateur utilisateur, String nomEntreprise, String secteur, String description, String adresse) {
        this.utilisateur = utilisateur;
        this.nomEntreprise = nomEntreprise;
        this.secteur = secteur;
        this.description = description;
        this.adresse = adresse;
        this.verifiee = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }

    public String getNomEntreprise() { return nomEntreprise; }
    public void setNomEntreprise(String nomEntreprise) { this.nomEntreprise = nomEntreprise; }

    public String getSecteur() { return secteur; }
    public void setSecteur(String secteur) { this.secteur = secteur; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getSiteWeb() { return siteWeb; }
    public void setSiteWeb(String siteWeb) { this.siteWeb = siteWeb; }

    public String getTailleEntreprise() { return tailleEntreprise; }
    public void setTailleEntreprise(String tailleEntreprise) { this.tailleEntreprise = tailleEntreprise; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public boolean isVerifiee() { return verifiee; }
    public void setVerifiee(boolean verifiee) { this.verifiee = verifiee; }
}
