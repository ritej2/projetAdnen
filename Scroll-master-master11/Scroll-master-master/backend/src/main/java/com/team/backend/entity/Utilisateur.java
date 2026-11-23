package com.team.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "utilisateurs")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "firebase_uid", nullable = false, unique = true, length = 128)
    private String firebaseUid;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(length = 40)
    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoleUtilisateur role;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(nullable = false)
    private boolean actif = true;

    public Utilisateur() {}

    public Utilisateur(String firebaseUid, String nom, String email, String telephone, RoleUtilisateur role) {
        this.firebaseUid = firebaseUid;
        this.nom = nom;
        this.email = email;
        this.telephone = telephone;
        this.role = role;
        this.dateCreation = LocalDateTime.now();
        this.actif = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirebaseUid() { return firebaseUid; }
    public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public RoleUtilisateur getRole() { return role; }
    public void setRole(RoleUtilisateur role) { this.role = role; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }
}
