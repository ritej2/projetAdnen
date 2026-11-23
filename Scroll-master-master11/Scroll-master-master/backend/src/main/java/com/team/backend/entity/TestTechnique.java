package com.team.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Test technique (QCM) rattaché à une offre d'emploi et créé par l'entreprise.
 * Les questions sont stockées en JSON : [{"question": "...", "options": ["a","b","c","d"], "bonneReponse": 1}]
 */
@Entity
@Table(name = "tests_techniques")
public class TestTechnique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "offre_id", nullable = false)
    private Offre offre;

    @Column(nullable = false, length = 255)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "duree_minutes")
    private Integer dureeMinutes = 20;

    @Column(name = "score_minimum")
    private Integer scoreMinimum = 60;

    @Column(name = "questions_json", columnDefinition = "LONGTEXT", nullable = false)
    private String questionsJson;

    @Column(name = "genere_par_ia")
    private boolean genereParIa = false;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(nullable = false)
    private boolean publie = true;

    @Column(nullable = false, length = 30)
    private String statut = "PUBLIE";

    public TestTechnique() {}

    public Long getId() { return id; }
    public Offre getOffre() { return offre; }
    public void setOffre(Offre offre) { this.offre = offre; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getDureeMinutes() { return dureeMinutes; }
    public void setDureeMinutes(Integer dureeMinutes) { this.dureeMinutes = dureeMinutes; }
    public Integer getScoreMinimum() { return scoreMinimum; }
    public void setScoreMinimum(Integer scoreMinimum) { this.scoreMinimum = scoreMinimum; }
    public String getQuestionsJson() { return questionsJson; }
    public void setQuestionsJson(String questionsJson) { this.questionsJson = questionsJson; }
    public boolean isGenereParIa() { return genereParIa; }
    public void setGenereParIa(boolean genereParIa) { this.genereParIa = genereParIa; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    public boolean isPublie() { return publie; }
    public void setPublie(boolean publie) { this.publie = publie; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}

