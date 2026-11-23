package com.team.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Résultat d'un candidat à un test technique (un seul passage autorisé par test et par candidature).
 */
@Entity
@Table(
    name = "passages_tests",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_passage_test_candidature", columnNames = {"test_id", "candidature_id"})
    }
)
public class PassageTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "test_id", nullable = false)
    private TestTechnique test;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidature_id", nullable = false)
    private Candidature candidature;

    @Column(name = "reponses_json", columnDefinition = "TEXT")
    private String reponsesJson;

    @Column(name = "bonnes_reponses")
    private Integer bonnesReponses;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    /** Score en pourcentage (0 - 100). */
    @Column(name = "score")
    private Integer score;

    @Column(name = "reussi")
    private boolean reussi;

    @Column(name = "date_passage", nullable = false)
    private LocalDateTime datePassage = LocalDateTime.now();

    public PassageTest() {}

    public Long getId() { return id; }
    public TestTechnique getTest() { return test; }
    public void setTest(TestTechnique test) { this.test = test; }
    public Candidature getCandidature() { return candidature; }
    public void setCandidature(Candidature candidature) { this.candidature = candidature; }
    public String getReponsesJson() { return reponsesJson; }
    public void setReponsesJson(String reponsesJson) { this.reponsesJson = reponsesJson; }
    public Integer getBonnesReponses() { return bonnesReponses; }
    public void setBonnesReponses(Integer bonnesReponses) { this.bonnesReponses = bonnesReponses; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public boolean isReussi() { return reussi; }
    public void setReussi(boolean reussi) { this.reussi = reussi; }
    public LocalDateTime getDatePassage() { return datePassage; }
    public void setDatePassage(LocalDateTime datePassage) { this.datePassage = datePassage; }
}

