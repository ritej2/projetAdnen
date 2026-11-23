package com.team.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "entretiens")
public class Entretien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidature_id", nullable = false)
    private Candidature candidature;

    @Column(name = "date_entretien", nullable = false)
    private LocalDateTime dateEntretien;

    @Column(name = "type_entretien", length = 80)
    private String typeEntretien = "Visioconférence";

    @Column(name = "lien_ou_lieu", length = 500)
    private String lienOuLieu;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatutEntretien statut = StatutEntretien.PLANIFIE;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    public Entretien() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Candidature getCandidature() { return candidature; }
    public void setCandidature(Candidature candidature) { this.candidature = candidature; }

    public LocalDateTime getDateEntretien() { return dateEntretien; }
    public void setDateEntretien(LocalDateTime dateEntretien) { this.dateEntretien = dateEntretien; }

    public String getTypeEntretien() { return typeEntretien; }
    public void setTypeEntretien(String typeEntretien) { this.typeEntretien = typeEntretien; }

    public String getLienOuLieu() { return lienOuLieu; }
    public void setLienOuLieu(String lienOuLieu) { this.lienOuLieu = lienOuLieu; }

    public StatutEntretien getStatut() { return statut; }
    public void setStatut(StatutEntretien statut) { this.statut = statut; }

    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }
}
