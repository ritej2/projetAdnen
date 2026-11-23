package com.team.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Évaluation automatique (moteur d'analyse IA JobFlow) d'une candidature :
 * note sur 20, scores détaillés, recommandation et décision finale du recruteur.
 */
@Entity
@Table(
    name = "evaluations_ia",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_evaluation_candidature", columnNames = {"candidature_id"})
    }
)
public class EvaluationIA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidature_id", nullable = false)
    private Candidature candidature;

    @Column(name = "note_sur_20")
    private Double noteSur20;

    @Column(name = "score_global")
    private Integer scoreGlobal;

    @Column(name = "score_competences")
    private Integer scoreCompetences;

    @Column(name = "score_experience")
    private Integer scoreExperience;

    @Column(name = "score_formation")
    private Integer scoreFormation;

    @Column(name = "score_motivation")
    private Integer scoreMotivation;

    @Column(name = "score_profil")
    private Integer scoreProfil;

    @Column(name = "score_test")
    private Integer scoreTest;

    /** ACCEPTER, ENTRETIEN, A_EXAMINER, REFUSER */
    @Column(name = "recommandation", length = 30)
    private String recommandation;

    @Column(name = "niveau_confiance")
    private Integer niveauConfiance;

    @Column(name = "competences_trouvees", columnDefinition = "TEXT")
    private String competencesTrouvees;

    @Column(name = "competences_manquantes", columnDefinition = "TEXT")
    private String competencesManquantes;

    @Column(name = "points_forts", columnDefinition = "TEXT")
    private String pointsForts;

    @Column(name = "points_amelioration", columnDefinition = "TEXT")
    private String pointsAmelioration;

    @Column(name = "synthese", columnDefinition = "TEXT")
    private String synthese;

    /** Décision validée par le recruteur (ACCEPTEE, ENTRETIEN, REFUSEE) ou null. */
    @Column(name = "decision_recruteur", length = 30)
    private String decisionRecruteur;

    @Column(name = "commentaire_recruteur", columnDefinition = "TEXT")
    private String commentaireRecruteur;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "date_evaluation", nullable = false)
    private LocalDateTime dateEvaluation = LocalDateTime.now();

    public EvaluationIA() {}

    public Long getId() { return id; }
    public Candidature getCandidature() { return candidature; }
    public void setCandidature(Candidature candidature) { this.candidature = candidature; }
    public Double getNoteSur20() { return noteSur20; }
    public void setNoteSur20(Double noteSur20) { this.noteSur20 = noteSur20; }
    public Integer getScoreGlobal() { return scoreGlobal; }
    public void setScoreGlobal(Integer scoreGlobal) { this.scoreGlobal = scoreGlobal; }
    public Integer getScoreCompetences() { return scoreCompetences; }
    public void setScoreCompetences(Integer scoreCompetences) { this.scoreCompetences = scoreCompetences; }
    public Integer getScoreExperience() { return scoreExperience; }
    public void setScoreExperience(Integer scoreExperience) { this.scoreExperience = scoreExperience; }
    public Integer getScoreFormation() { return scoreFormation; }
    public void setScoreFormation(Integer scoreFormation) { this.scoreFormation = scoreFormation; }
    public Integer getScoreMotivation() { return scoreMotivation; }
    public void setScoreMotivation(Integer scoreMotivation) { this.scoreMotivation = scoreMotivation; }
    public Integer getScoreProfil() { return scoreProfil; }
    public void setScoreProfil(Integer scoreProfil) { this.scoreProfil = scoreProfil; }
    public Integer getScoreTest() { return scoreTest; }
    public void setScoreTest(Integer scoreTest) { this.scoreTest = scoreTest; }
    public String getRecommandation() { return recommandation; }
    public void setRecommandation(String recommandation) { this.recommandation = recommandation; }
    public Integer getNiveauConfiance() { return niveauConfiance; }
    public void setNiveauConfiance(Integer niveauConfiance) { this.niveauConfiance = niveauConfiance; }
    public String getCompetencesTrouvees() { return competencesTrouvees; }
    public void setCompetencesTrouvees(String competencesTrouvees) { this.competencesTrouvees = competencesTrouvees; }
    public String getCompetencesManquantes() { return competencesManquantes; }
    public void setCompetencesManquantes(String competencesManquantes) { this.competencesManquantes = competencesManquantes; }
    public String getPointsForts() { return pointsForts; }
    public void setPointsForts(String pointsForts) { this.pointsForts = pointsForts; }
    public String getPointsAmelioration() { return pointsAmelioration; }
    public void setPointsAmelioration(String pointsAmelioration) { this.pointsAmelioration = pointsAmelioration; }
    public String getSynthese() { return synthese; }
    public void setSynthese(String synthese) { this.synthese = synthese; }
    public String getDecisionRecruteur() { return decisionRecruteur; }
    public void setDecisionRecruteur(String decisionRecruteur) { this.decisionRecruteur = decisionRecruteur; }
    public String getCommentaireRecruteur() { return commentaireRecruteur; }
    public void setCommentaireRecruteur(String commentaireRecruteur) { this.commentaireRecruteur = commentaireRecruteur; }
    public LocalDateTime getDateValidation() { return dateValidation; }
    public void setDateValidation(LocalDateTime dateValidation) { this.dateValidation = dateValidation; }
    public LocalDateTime getDateEvaluation() { return dateEvaluation; }
    public void setDateEvaluation(LocalDateTime dateEvaluation) { this.dateEvaluation = dateEvaluation; }
}

