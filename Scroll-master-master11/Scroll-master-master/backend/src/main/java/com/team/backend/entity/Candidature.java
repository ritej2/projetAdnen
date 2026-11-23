package com.team.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "candidatures",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_candidature_candidat_offre", columnNames = {"candidat_id", "offre_id"})
    }
)
public class Candidature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "offre_id", nullable = false)
    private Offre offre;

    @Column(name = "date_candidature", nullable = false)
    private LocalDateTime dateCandidature = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatutCandidature statut = StatutCandidature.EN_ATTENTE;

    @Column(name = "lettre_motivation", columnDefinition = "TEXT")
    private String lettreMotivation;

    @Column(name = "cv_url_specifique", length = 500)
    private String cvUrlSpecifique;

    @Column(name = "note_recruteur", columnDefinition = "TEXT")
    private String noteRecruteur;

    @Column(name = "score_matching")
    private Integer scoreMatching = 85;

    public Candidature() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Candidat getCandidat() { return candidat; }
    public void setCandidat(Candidat candidat) { this.candidat = candidat; }

    public Offre getOffre() { return offre; }
    public void setOffre(Offre offre) { this.offre = offre; }

    public LocalDateTime getDateCandidature() { return dateCandidature; }
    public void setDateCandidature(LocalDateTime dateCandidature) { this.dateCandidature = dateCandidature; }

    public StatutCandidature getStatut() { return statut; }
    public void setStatut(StatutCandidature statut) { this.statut = statut; }

    public String getLettreMotivation() { return lettreMotivation; }
    public void setLettreMotivation(String lettreMotivation) { this.lettreMotivation = lettreMotivation; }

    public String getCvUrlSpecifique() { return cvUrlSpecifique; }
    public void setCvUrlSpecifique(String cvUrlSpecifique) { this.cvUrlSpecifique = cvUrlSpecifique; }

    public String getNoteRecruteur() { return noteRecruteur; }
    public void setNoteRecruteur(String noteRecruteur) { this.noteRecruteur = noteRecruteur; }

    public Integer getScoreMatching() { return scoreMatching; }
    public void setScoreMatching(Integer scoreMatching) { this.scoreMatching = scoreMatching; }
}
