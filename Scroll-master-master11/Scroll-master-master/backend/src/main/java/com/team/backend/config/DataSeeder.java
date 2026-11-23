package com.team.backend.config;

import com.team.backend.controller.FileStorageController;
import com.team.backend.entity.*;
import com.team.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedDatabase(
        UtilisateurRepository utilisateurRepository,
        CandidatRepository candidatRepository,
        EntrepriseRepository entrepriseRepository,
        OffreRepository offreRepository,
        CandidatureRepository candidatureRepository,
        EntretienRepository entretienRepository,
        FavoriRepository favoriRepository,
        RechercheRepository rechercheRepository,
        TestTechniqueRepository testTechniqueRepository,
        PassageTestRepository passageTestRepository,
        JdbcTemplate jdbcTemplate
    ) {
        return new CommandLineRunner() {
            @Override
            @Transactional
            public void run(String... args) {
                if (utilisateurRepository.count() == 0) {
                    seedInitialData();
                }
                syncLegacyMySqlTables(jdbcTemplate);
                enrichAndEnsureVisibleData(jdbcTemplate);
            }

            private String fixMojibake(String s) {
                if (s == null) return null;
                return s
                    .replace("Ã©", "é")
                    .replace("Ã¨", "è")
                    .replace("Ãª", "ê")
                    .replace("Ã«", "ë")
                    .replace("Ã ", "à")
                    .replace("Ã¢", "â")
                    .replace("Ã´", "ô")
                    .replace("Ã®", "î")
                    .replace("Ã¯", "ï")
                    .replace("Ã¹", "ù")
                    .replace("Ã»", "û")
                    .replace("Ã§", "ç")
                    .replace("Ã‰", "É")
                    .replace("Ã€", "À")
                    .replace("â€™", "’")
                    .replace("â€“", "–")
                    .replace("â€”", "—")
                    .replace("Â·", "·")
                    .replace("Ǹ", "é");
            }

            private void enrichAndEnsureVisibleData(JdbcTemplate jdbc) {
                try {
                    Path cvDir = Paths.get("uploads", "cv").toAbsolutePath().normalize();
                    Files.createDirectories(cvDir);

                    String[] companyLogos = new String[] {
                        "/images/resource/company-1.png",
                        "/images/resource/company-2.png",
                        "/images/resource/company-3.png",
                        "/images/resource/company-4.png",
                        "/images/resource/company-5.png",
                        "/images/resource/company-6.png"
                    };

                    // 1. Clean & Enrich all Companies (Logos, Descriptions, Sectors)
                    List<Entreprise> allCompanies = entrepriseRepository.findAll();
                    for (int i = 0; i < allCompanies.size(); i++) {
                        Entreprise ent = allCompanies.get(i);
                        ent.setNomEntreprise(fixMojibake(ent.getNomEntreprise()));
                        ent.setSecteur(fixMojibake(ent.getSecteur()));
                        ent.setDescription(fixMojibake(ent.getDescription()));
                        ent.setAdresse(fixMojibake(ent.getAdresse()));

                        if (ent.getLogoUrl() == null || ent.getLogoUrl().isBlank() || ent.getLogoUrl().contains("unsplash.com")) {
                            ent.setLogoUrl(companyLogos[i % companyLogos.length]);
                        }
                        if (ent.getSiteWeb() == null || ent.getSiteWeb().isBlank()) {
                            String slug = ent.getNomEntreprise().toLowerCase().replaceAll("[^a-z0-9]+", "");
                            ent.setSiteWeb("https://" + (slug.isEmpty() ? "company" : slug) + ".io");
                        }
                        if (ent.getTailleEntreprise() == null || ent.getTailleEntreprise().isBlank()) {
                            ent.setTailleEntreprise("120–350 collaborateurs");
                        }
                        if ("mohhm".equalsIgnoreCase(ent.getNomEntreprise())) {
                            ent.setNomEntreprise("Mohhm Cloud Technologies");
                            ent.setSecteur("Cloud Native & DevSecOps");
                            ent.setDescription("Éditeur de solutions Cloud Native et d'orchestration Kubernetes pour les entreprises internationales.");
                        } else if ("test10".equalsIgnoreCase(ent.getNomEntreprise())) {
                            ent.setNomEntreprise("Test10 Digital Lab");
                            ent.setSecteur("Ingénierie Logicielle & IA");
                            ent.setDescription("Studio d'ingénierie logicielle spécialisé dans les plateformes web haute performance et l'IA appliquée.");
                        }
                        ent.setVerifiee(true);
                        entrepriseRepository.save(ent);
                    }

                    // 2. Clean & Enrich all Offers
                    List<Offre> allOffers = offreRepository.findAll();
                    for (Offre o : allOffers) {
                        o.setTitre(fixMojibake(o.getTitre()));
                        o.setDescription(fixMojibake(o.getDescription()));
                        o.setMissions(fixMojibake(o.getMissions()));
                        o.setProfilRecherche(fixMojibake(o.getProfilRecherche()));
                        o.setLocalisation(fixMojibake(o.getLocalisation()));
                        o.setCategorie(fixMojibake(o.getCategorie()));
                        o.setModeTravail(fixMojibake(o.getModeTravail()));
                        o.setNiveauExperience(fixMojibake(o.getNiveauExperience()));
                        o.setCompetencesRequises(fixMojibake(o.getCompetencesRequises()));
                        offreRepository.save(o);
                    }

                    // 3. Clean & Enrich all Candidates + Generate Real PDF CVs
                    List<Candidat> allCandidates = candidatRepository.findAll();
                    for (Candidat c : allCandidates) {
                        Utilisateur u = c.getUtilisateur();
                        String nom = u != null && u.getNom() != null ? fixMojibake(u.getNom()) : "Candidat JobFlow";
                        if ("gomri".equalsIgnoreCase(nom)) {
                            nom = "Mohamed Gomri";
                            u.setNom(nom);
                            utilisateurRepository.save(u);
                        } else if ("wassimtest".equalsIgnoreCase(nom)) {
                            nom = "Wassim Mansouri";
                            u.setNom(nom);
                            utilisateurRepository.save(u);
                        } else if ("wassimmaywgomri".equalsIgnoreCase(nom)) {
                            nom = "Mayssa Gomri";
                            u.setNom(nom);
                            utilisateurRepository.save(u);
                        }

                        c.setTitreProfil(fixMojibake(c.getTitreProfil()));
                        if (c.getTitreProfil() == null || c.getTitreProfil().length() < 6) {
                            c.setTitreProfil("Ingénieur Full Stack Java 21 / React & Cloud Architect");
                        }
                        c.setAdresse(fixMojibake(c.getAdresse()));
                        if (c.getAdresse() == null || c.getAdresse().equalsIgnoreCase("France")) {
                            c.setAdresse("Paris, France (Hybride / Télétravail)");
                        }
                        c.setCompetences(fixMojibake(c.getCompetences()));
                        if (c.getCompetences() == null || c.getCompetences().length() < 10) {
                            c.setCompetences("Java 21, Spring Boot 3, React 19, TypeScript, MySQL 8, Docker, Kubernetes, Git, CI/CD");
                        }
                        c.setBio(fixMojibake(c.getBio()));
                        if (c.getBio() == null || c.getBio().length() < 15) {
                            c.setBio("Ingénieur logiciel passionné par le développement d'applications SaaS robustes, les architectures microservices Spring Boot et les interfaces 3D interactives en React/TypeScript.");
                        }
                        c.setExperience(fixMojibake(c.getExperience()));
                        if (c.getExperience() == null || c.getExperience().length() < 10) {
                            c.setExperience("Full Stack Software Engineer chez NovaTech Cloud (2023–2026) · Développeur Web Full Stack chez Digital Factory (2021–2023)");
                        }
                        c.setFormation(fixMojibake(c.getFormation()));
                        if (c.getFormation() == null || c.getFormation().length() < 10) {
                            c.setFormation("Diplôme d'Ingénieur / Master 2 en Génie Logiciel & Systèmes d'Information (2023)");
                        }
                        if (c.getLinkedinUrl() == null || c.getLinkedinUrl().isBlank()) {
                            String slug = nom.toLowerCase().replaceAll("[^a-z0-9]+", "-");
                            c.setLinkedinUrl("https://linkedin.com/in/" + slug);
                        }
                        if (c.getPortfolioUrl() == null || c.getPortfolioUrl().isBlank()) {
                            String slug = nom.toLowerCase().replaceAll("[^a-z0-9]+", "");
                            c.setPortfolioUrl("https://" + slug + ".dev");
                        }

                        // Generate real PDF CV file in uploads/cv/
                        String slug = nom.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
                        if (slug.isEmpty()) slug = "candidat-" + c.getId();
                        String pdfFileName = "cv-" + slug + ".pdf";
                        Path pdfPath = cvDir.resolve(pdfFileName);
                        byte[] pdfBytes = FileStorageController.buildProfessionalCvPdf(
                            nom,
                            c.getTitreProfil(),
                            u != null && u.getEmail() != null ? u.getEmail() : (slug + "@talentflow.io"),
                            u != null && u.getTelephone() != null ? u.getTelephone() : "+33 6 45 78 90 12",
                            c.getAdresse(),
                            c.getBio(),
                            c.getCompetences(),
                            c.getExperience(),
                            c.getFormation()
                        );
                        Files.write(pdfPath, pdfBytes);

                        c.setCvUrl("/api/files/cv/" + pdfFileName);
                        candidatRepository.save(c);
                    }

                    // 4. Update existing Candidatures with real PDF CV URLs & rich applications for all key accounts
                    List<Candidature> existingApps = candidatureRepository.findAll();
                    for (Candidature app : existingApps) {
                        if (app.getCandidat() != null && app.getCandidat().getCvUrl() != null) {
                            app.setCvUrlSpecifique(app.getCandidat().getCvUrl());
                            candidatureRepository.save(app);
                        }
                    }

                    // Add rich applications, interviews, favorites & saved searches for candidates that have 0 applications
                    if (allOffers.size() >= 6) {
                        for (int idx = 0; idx < allCandidates.size(); idx++) {
                            Candidat cand = allCandidates.get(idx);
                            List<Candidature> candApps = candidatureRepository.findByCandidatIdOrderByDateCandidatureDesc(cand.getId());
                            if (candApps.isEmpty()) {
                                Offre target1 = allOffers.get(idx % allOffers.size());
                                Offre target2 = allOffers.get((idx + 2) % allOffers.size());
                                Offre target3 = allOffers.get((idx + 4) % allOffers.size());

                                Candidature a1 = new Candidature();
                                a1.setCandidat(cand);
                                a1.setOffre(target1);
                                a1.setDateCandidature(LocalDateTime.now().minusDays(2));
                                a1.setStatut(StatutCandidature.ENTRETIEN);
                                a1.setLettreMotivation("Fort d'une solide expérience sur Java 21, Spring Boot et React, je souhaite rejoindre votre équipe pour contribuer activement à vos projets stratégiques.");
                                a1.setCvUrlSpecifique(cand.getCvUrl());
                                a1.setNoteRecruteur("Profil technique très solide, CV validé pour l'entretien technique.");
                                a1.setScoreMatching(94);
                                a1 = candidatureRepository.save(a1);

                                Entretien ent = new Entretien();
                                ent.setCandidature(a1);
                                ent.setDateEntretien(LocalDateTime.now().plusDays(2).withHour(15).withMinute(0));
                                ent.setTypeEntretien("Entretien Technique & Architecture (Visio)");
                                ent.setLienOuLieu("https://meet.talentflow.io/entretien-" + cand.getId());
                                ent.setStatut(StatutEntretien.PLANIFIE);
                                ent.setCommentaire("Revue de code Full Stack Java/React et présentation des projets récents.");
                                entretienRepository.save(ent);

                                Candidature a2 = new Candidature();
                                a2.setCandidat(cand);
                                a2.setOffre(target2);
                                a2.setDateCandidature(LocalDateTime.now().minusDays(5));
                                a2.setStatut(StatutCandidature.EN_COURS_EXAMEN);
                                a2.setLettreMotivation("Votre vision produit et votre stack technique correspondent parfaitement à mes compétences et à mes ambitions professionnelles.");
                                a2.setCvUrlSpecifique(cand.getCvUrl());
                                a2.setNoteRecruteur("Dossier en cours d'évaluation par le Tech Lead.");
                                a2.setScoreMatching(89);
                                candidatureRepository.save(a2);

                                Candidature a3 = new Candidature();
                                a3.setCandidat(cand);
                                a3.setOffre(target3);
                                a3.setDateCandidature(LocalDateTime.now().minusDays(8));
                                a3.setStatut(StatutCandidature.ACCEPTEE);
                                a3.setLettreMotivation("Disponible immédiatement pour accompagner la croissance de votre plateforme.");
                                a3.setCvUrlSpecifique(cand.getCvUrl());
                                a3.setNoteRecruteur("Excellente prestation lors des tests techniques. Offre acceptée !");
                                a3.setScoreMatching(97);
                                candidatureRepository.save(a3);
                            }

                            if (favoriRepository.findByCandidatIdOrderByDateAjoutDesc(cand.getId()).isEmpty() && allOffers.size() >= 3) {
                                favoriRepository.save(new Favori(cand, allOffers.get(0)));
                                favoriRepository.save(new Favori(cand, allOffers.get(Math.min(2, allOffers.size() - 1))));
                            }

                            if (rechercheRepository.findByCandidatIdOrderByDateRechercheDesc(cand.getId()).isEmpty()) {
                                Recherche r1 = new Recherche();
                                r1.setCandidat(cand);
                                r1.setMotCle("Full Stack Java React");
                                r1.setLocalisation("Paris");
                                r1.setTypeContrat("CDI");
                                r1.setCategorie("Ingénierie & Tech");
                                rechercheRepository.save(r1);
                            }
                        }
                    }

                    // S'assurer que toute candidature acceptée possède son passage de test validé
                    List<Candidature> acceptedApps = candidatureRepository.findAll().stream()
                        .filter(c -> c.getStatut() == StatutCandidature.ACCEPTEE).toList();
                    for (Candidature app : acceptedApps) {
                        List<PassageTest> pList = passageTestRepository.findByCandidatureIdOrderByDatePassageDesc(app.getId());
                        if (pList.isEmpty()) {
                            TestTechnique tt = testTechniqueRepository.findByOffreIdOrderByDateCreationDesc(app.getOffre().getId()).stream().findFirst().orElseGet(() -> {
                                TestTechnique newT = new TestTechnique();
                                newT.setOffre(app.getOffre());
                                newT.setTitre("Évaluation Technique IA - " + app.getOffre().getTitre());
                                newT.setDescription("Test d'aptitude technique pour le poste de " + app.getOffre().getTitre());
                                newT.setDureeMinutes(20);
                                newT.setScoreMinimum(60);
                                newT.setGenereParIa(true);
                                newT.setQuestionsJson("[{\"id\":1,\"enonce\":\"Quelle commande SQL permet de filtrer après un regroupement GROUP BY ?\",\"options\":[\"WHERE\",\"HAVING\",\"GROUP BY\",\"ORDER BY\"],\"bonneReponse\":1,\"explication\":\"HAVING s'applique après GROUP BY.\"},{\"id\":2,\"enonce\":\"Quel index optimise les recherches d'égalité exacte ?\",\"options\":[\"B-Tree / Hash\",\"Full-Text\",\"Spatial\",\"GiST\"],\"bonneReponse\":0,\"explication\":\"L'index Hash ou B-Tree est idéal.\"},{\"id\":3,\"enonce\":\"En Java 21, quelle fonctionnalité permet d'exécuter des millions de threads légers ?\",\"options\":[\"Virtual Threads (Project Loom)\",\"Fibers C++\",\"Reactive RxJava\",\"SingleThreadExecutor\"],\"bonneReponse\":0,\"explication\":\"Les Virtual Threads introduits en Java 21.\"},{\"id\":4,\"enonce\":\"Que garantit le principe ACID dans une transaction SQL ?\",\"options\":[\"Atomicité, Cohérence, Isolation, Durabilité\",\"Vitesse d'écriture\",\"Compression des données\",\"Chiffrement SSL\"],\"bonneReponse\":0,\"explication\":\"ACID = Atomicité, Cohérence, Isolation, Durabilité.\"},{\"id\":5,\"enonce\":\"Quel hook React permet de mémoriser un calcul coûteux ?\",\"options\":[\"useMemo\",\"useEffect\",\"useCallback\",\"useState\"],\"bonneReponse\":0,\"explication\":\"useMemo mémorise une valeur calculée.\"]");
                                return testTechniqueRepository.save(newT);
                            });
                            PassageTest pt = new PassageTest();
                            pt.setTest(tt);
                            pt.setCandidature(app);
                            pt.setBonnesReponses(5);
                            pt.setTotalQuestions(5);
                            pt.setScore(95);
                            pt.setReussi(true);
                            pt.setDatePassage(app.getDateCandidature().plusDays(1));
                            pt.setReponsesJson("[1,0,0,0,0]");
                            passageTestRepository.save(pt);
                        }
                    }

                    // 5. Enrich Admin Reports & Notifications in MySQL if few exist
                    try {
                        Integer reportCount = jdbc.queryForObject("SELECT COUNT(*) FROM job_offer_reports", Integer.class);
                        if (reportCount != null && reportCount < 5) {
                            jdbc.update(
                                "INSERT INTO job_offer_reports (user_id, job_offer_id, reason, description, status) VALUES " +
                                "(5, 1, 'Vérification fourchette salariale', 'Demande de confirmation si le package inclut les primes annuelles et le télétravail.', 'REVIEWED'), " +
                                "(6, 2, 'Précision sur le rythme hybride', 'Le poste indique Hybride à Lyon, possibilité de 3 jours de télétravail par semaine ?', 'PENDING'), " +
                                "(7, 3, 'Contrôle qualité annonce FinPulse', 'Audit périodique de conformité des offres mises en avant sur la plateforme.', 'ACTION_TAKEN'), " +
                                "(5, 4, 'Lien de test technique expiré', 'Le candidat signale que le lien de test nécessite une mise à jour.', 'PENDING')"
                            );
                        }
                        Integer notifCount = jdbc.queryForObject("SELECT COUNT(*) FROM notifications", Integer.class);
                        if (notifCount != null && notifCount < 6) {
                            jdbc.update(
                                "INSERT INTO notifications (user_id, message, is_read) VALUES " +
                                "(1, 'Nouvel entretien programmé : Nova Studio a planifié un entretien technique avec Marie Dubois.', 0), " +
                                "(5, 'Félicitations ! Votre profil a atteint 96% de matching sur le poste Senior Full Stack Engineer.', 0), " +
                                "(2, 'Nouvelle candidature reçue : Un candidat vérifié avec CV PDF a postulé à votre offre.', 0), " +
                                "(6, 'Invitation à passer le test technique Java 21 & Spring Boot 3 envoyée par NovaTech Solutions.', 0), " +
                                "(1, 'Synchronisation MySQL scroll_master active : Toutes les 19 tables MySQL Workbench sont synchronisées.', 1)"
                            );
                        }
                    } catch (Exception ignored) {
                    }
                } catch (Exception ignored) {
                }
            }

            private void syncLegacyMySqlTables(JdbcTemplate jdbc) {
                try {
                    List<Map<String, Object>> legacyUsers = jdbc.queryForList("SELECT * FROM users");
                    for (Map<String, Object> lu : legacyUsers) {
                        String email = String.valueOf(lu.get("email")).trim().toLowerCase();
                        if (utilisateurRepository.existsByEmail(email)) continue;

                        String name = String.valueOf(lu.get("name"));
                        String phone = lu.get("phone") != null ? String.valueOf(lu.get("phone")) : "+33 6 00 00 00 00";
                        String roleStr = String.valueOf(lu.get("role"));
                        RoleUtilisateur role = RoleUtilisateur.CANDIDAT;
                        if ("COMPANY".equalsIgnoreCase(roleStr)) role = RoleUtilisateur.ENTREPRISE;
                        else if ("ADMIN".equalsIgnoreCase(roleStr)) role = RoleUtilisateur.ADMIN;

                        String uid = "uid-mysql-" + lu.get("id");
                        Utilisateur u = new Utilisateur(uid, name, email, phone, role);
                        u = utilisateurRepository.save(u);

                        if (role == RoleUtilisateur.CANDIDAT) {
                            List<Map<String, Object>> cpList = jdbc.queryForList(
                                "SELECT * FROM candidate_profiles WHERE user_id = ?", lu.get("id")
                            );
                            Candidat c = new Candidat(
                                u,
                                !cpList.isEmpty() && cpList.get(0).get("headline") != null
                                    ? String.valueOf(cpList.get(0).get("headline"))
                                    : "Ingénieur Logiciel Full Stack",
                                "France",
                                !cpList.isEmpty() && cpList.get(0).get("skills") != null
                                    ? String.valueOf(cpList.get(0).get("skills"))
                                    : "React, TypeScript, Spring Boot, SQL"
                            );
                            if (!cpList.isEmpty()) {
                                Map<String, Object> cp = cpList.get(0);
                                if (cp.get("about_me") != null) c.setBio(String.valueOf(cp.get("about_me")));
                                if (cp.get("education") != null) c.setFormation(String.valueOf(cp.get("education")));
                                if (cp.get("experience") != null) c.setExperience(String.valueOf(cp.get("experience")));
                            }
                            candidatRepository.save(c);
                        } else if (role == RoleUtilisateur.ENTREPRISE) {
                            List<Map<String, Object>> compList = jdbc.queryForList(
                                "SELECT * FROM company_profiles WHERE user_id = ?", lu.get("id")
                            );
                            String compName = !compList.isEmpty() && compList.get(0).get("company_name") != null
                                ? String.valueOf(compList.get(0).get("company_name"))
                                : name;
                            String desc = !compList.isEmpty() && compList.get(0).get("description") != null
                                ? String.valueOf(compList.get(0).get("description"))
                                : "Entreprise technologique partenaire JobFlow.";
                            String addr = !compList.isEmpty() && compList.get(0).get("address") != null
                                ? String.valueOf(compList.get(0).get("address"))
                                : "Paris, France";
                            Entreprise ent = new Entreprise(u, compName, "Technologie & Cloud", desc, addr);
                            if (!compList.isEmpty()) {
                                Map<String, Object> cp = compList.get(0);
                                if (cp.get("website") != null) ent.setSiteWeb(String.valueOf(cp.get("website")));
                                if (cp.get("logo_url") != null) ent.setLogoUrl(String.valueOf(cp.get("logo_url")));
                            }
                            ent.setTailleEntreprise("100–350 collaborateurs");
                            ent = entrepriseRepository.save(ent);

                            if (!compList.isEmpty()) {
                                Object legacyCompId = compList.get(0).get("id");
                                List<Map<String, Object>> legacyJobs = jdbc.queryForList(
                                    "SELECT * FROM job_offers WHERE company_id = ?", legacyCompId
                                );
                                for (Map<String, Object> lj : legacyJobs) {
                                    String title = String.valueOf(lj.get("title"));
                                    String jDesc = String.valueOf(lj.get("description"));
                                    String loc = lj.get("location") != null ? String.valueOf(lj.get("location")) : "Paris, France";
                                    String cType = "CDI";
                                    if ("INTERNSHIP".equalsIgnoreCase(String.valueOf(lj.get("contract_type")))) cType = "Stage";
                                    BigDecimal sMin = lj.get("salary_min") != null ? new BigDecimal(String.valueOf(lj.get("salary_min"))) : new BigDecimal("45000");
                                    BigDecimal sMax = lj.get("salary_max") != null ? new BigDecimal(String.valueOf(lj.get("salary_max"))) : new BigDecimal("58000");
                                    Offre newO = createOffre(
                                        ent,
                                        title,
                                        jDesc,
                                        "• Développer des fonctionnalités scalables et performantes.\n• Participer aux revues d'architecture et à la qualité du code.",
                                        "• Formation Bac+5 ou École d'ingénieur.\n• Maîtrise des technologies modernes du poste.",
                                        loc,
                                        loc.toLowerCase().contains("télétravail") ? "Télétravail" : "Hybride",
                                        title.toLowerCase().contains("designer") ? "Design & Produit" : (title.toLowerCase().contains("data") ? "Data & IA" : "Ingénierie & Tech"),
                                        cType,
                                        "Confirmé (3–5 ans)",
                                        "Java 21, Spring Boot, React, TypeScript, MySQL, Docker",
                                        sMin,
                                        sMax,
                                        LocalDate.now().minusDays(2)
                                    );
                                    offreRepository.save(newO);
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {
                    // Legacy tables might not exist in H2 dev mode
                }
            }

            private void seedInitialData() {

                // 1. Users
                Utilisateur adminUser = new Utilisateur(
                    "uid-admin-1",
                    "Alexandre Moreau",
                    "admin@talentflow.io",
                    "+33 1 42 68 55 00",
                    RoleUtilisateur.ADMIN
                );
                adminUser = utilisateurRepository.save(adminUser);

                Utilisateur cand1User = new Utilisateur(
                    "uid-candidat-1",
                    "Marie Dubois",
                    "marie.dubois@talentflow.io",
                    "+33 6 12 34 56 78",
                    RoleUtilisateur.CANDIDAT
                );
                cand1User = utilisateurRepository.save(cand1User);

                Utilisateur cand2User = new Utilisateur(
                    "uid-candidat-2",
                    "Thomas Bernard",
                    "thomas.bernard@talentflow.io",
                    "+33 6 98 76 54 32",
                    RoleUtilisateur.CANDIDAT
                );
                cand2User = utilisateurRepository.save(cand2User);

                Utilisateur cand3User = new Utilisateur(
                    "uid-candidat-3",
                    "Camille Laurent",
                    "camille.laurent@talentflow.io",
                    "+33 6 45 11 22 33",
                    RoleUtilisateur.CANDIDAT
                );
                cand3User = utilisateurRepository.save(cand3User);

                Utilisateur comp1User = new Utilisateur(
                    "uid-entreprise-1",
                    "Sophie Mercier (Nova Studio)",
                    "recrutement@novastudio.io",
                    "+33 1 88 22 44 10",
                    RoleUtilisateur.ENTREPRISE
                );
                comp1User = utilisateurRepository.save(comp1User);

                Utilisateur comp2User = new Utilisateur(
                    "uid-entreprise-2",
                    "Marc Lefèvre (Lumen AI)",
                    "careers@lumen-ai.fr",
                    "+33 4 72 10 20 30",
                    RoleUtilisateur.ENTREPRISE
                );
                comp2User = utilisateurRepository.save(comp2User);

                Utilisateur comp3User = new Utilisateur(
                    "uid-entreprise-3",
                    "Claire Garnier (FinPulse)",
                    "talent@finpulse.eu",
                    "+33 1 55 90 12 34",
                    RoleUtilisateur.ENTREPRISE
                );
                comp3User = utilisateurRepository.save(comp3User);

                // 2. Candidates
                Candidat cand1 = new Candidat(
                    cand1User,
                    "Ingénieure Full Stack Java / React",
                    "Paris, France",
                    "Java 21, Spring Boot, React, TypeScript, PostgreSQL, Docker, Tailwind CSS"
                );
                cand1.setBio("Ingénieure logicielle passionnée par la conception d'architectures cloud scalables et d'interfaces SaaS modernes. 4 ans d'expérience en environnement agile.");
                cand1.setFormation("Master Informatique & Génie Logiciel — Sorbonne Université (2022)");
                cand1.setExperience("Full Stack Developer chez ScaleUp Tech (2022–2026) · Développeuse Frontend chez Atelier Digital (2021–2022)");
                cand1.setCvUrl("/api/files/cv/cv-marie-dubois.pdf");
                cand1.setLinkedinUrl("https://linkedin.com/in/marie-dubois-dev");
                cand1.setPortfolioUrl("https://mariedubois.dev");
                cand1 = candidatRepository.save(cand1);

                Candidat cand2 = new Candidat(
                    cand2User,
                    "Product Designer Senior (UI/UX)",
                    "Lyon, France",
                    "Figma, Design Systems, UX Research, Prototyping, React, Tailwind CSS"
                );
                cand2.setBio("Designer produit spécialisé dans les plateformes B2B SaaS et Fintech. Créateur de systèmes de design accessibles et performants.");
                cand2.setFormation("Mastère Direction Artistique & Design Numérique — Gobelins Paris");
                cand2.setExperience("Senior Product Designer chez PayFlow (2023–2026)");
                cand2.setCvUrl("/api/files/cv/cv-thomas-bernard.pdf");
                cand2 = candidatRepository.save(cand2);

                Candidat cand3 = new Candidat(
                    cand3User,
                    "Data & AI Engineer",
                    "Bordeaux, France",
                    "Python, PyTorch, SQL, PostgreSQL, Apache Spark, MLOps, AWS"
                );
                cand3.setBio("Data Engineer orientée industrialisation de modèles IA et pipelines temps réel.");
                cand3.setFormation("Diplôme d'Ingénieur — ENSEIRB-MATMECA");
                cand3.setExperience("Data Engineer chez Aquitaine Analytics (2023–2026)");
                cand3.setCvUrl("/api/files/cv/cv-camille-laurent.pdf");
                cand3 = candidatRepository.save(cand3);

                // 3. Companies
                Entreprise comp1 = new Entreprise(
                    comp1User,
                    "Nova Studio",
                    "SaaS & Cloud Architecture",
                    "Nova Studio conçoit des outils collaboratifs de nouvelle génération pour les équipes produit et ingénierie européennes.",
                    "42 Rue de Paradis, 75010 Paris"
                );
                comp1.setSiteWeb("https://novastudio.io");
                comp1.setLogoUrl("/images/resource/company-1.png");
                comp1.setTailleEntreprise("50–150 collaborateurs");
                comp1.setVerifiee(true);
                comp1 = entrepriseRepository.save(comp1);

                Entreprise comp2 = new Entreprise(
                    comp2User,
                    "Lumen AI",
                    "Intelligence Artificielle & Data",
                    "Laboratoire et éditeur de solutions d'IA générative dédiées à l'automatisation documentaire et à l'analyse prédictive.",
                    "15 Quai des Célestins, 69002 Lyon"
                );
                comp2.setSiteWeb("https://lumen-ai.fr");
                comp2.setLogoUrl("/images/resource/company-2.png");
                comp2.setTailleEntreprise("150–400 collaborateurs");
                comp2.setVerifiee(true);
                comp2 = entrepriseRepository.save(comp2);

                Entreprise comp3 = new Entreprise(
                    comp3User,
                    "FinPulse",
                    "Fintech & Infrastructure Bancaire",
                    "Plateforme européenne de gestion de trésorerie en temps réel et d'automatisation comptable pour les PME et ETI.",
                    "88 Avenue de la République, 33000 Bordeaux"
                );
                comp3.setSiteWeb("https://finpulse.eu");
                comp3.setLogoUrl("/images/resource/company-3.png");
                comp3.setTailleEntreprise("200–500 collaborateurs");
                comp3.setVerifiee(true);
                comp3 = entrepriseRepository.save(comp3);

                // 4. Job Offers
                Offre o1 = createOffre(
                    comp1,
                    "Senior Full Stack Engineer (Java 21 / React)",
                    "Rejoignez l'équipe Core Platform de Nova Studio pour concevoir et faire évoluer nos microservices Spring Boot et notre interface client React/TypeScript.",
                    "• Concevoir des API REST haute performance avec Java 21 et Spring Boot 3.\n• Développer des interfaces fluides et accessibles en React, TypeScript et Tailwind CSS.\n• Optimiser les requêtes PostgreSQL et accompagner l'équipe dans les revues de code.",
                    "• 3+ ans d'expérience en développement Full Stack Java & React.\n• Maîtrise de Spring Security, JPA/Hibernate et PostgreSQL.\n• Sensibilité marquée pour la qualité UX et les architectures propres.",
                    "Paris, France",
                    "Hybride",
                    "Ingénierie & Tech",
                    "CDI",
                    "Senior (4–7 ans)",
                    "Java 21, Spring Boot, React, TypeScript, PostgreSQL, Docker",
                    new BigDecimal("62000"),
                    new BigDecimal("76000"),
                    LocalDate.now().minusDays(2)
                );
                o1 = offreRepository.save(o1);

                Offre o2 = createOffre(
                    comp1,
                    "Lead Product Designer — Design System",
                    "Nous recherchons un(e) Lead Product Designer pour piloter l'évolution de notre système de design et accompagner nos squads produit.",
                    "• Définir et maintenir les composants de notre Design System sur Figma et en lien avec les développeurs React.\n• Mener les recherches utilisateurs et les tests d'utilisabilité.\n• Concevoir des parcours simples pour des problématiques métiers riches.",
                    "• 4+ ans d'expérience en Product Design sur des produits SaaS B2B.\n• Excellente maîtrise de Figma, des tokens de design et de l'accessibilité RGAA/WCAG.",
                    "Paris, France",
                    "Télétravail partiel",
                    "Design & Produit",
                    "CDI",
                    "Confirmé (3–5 ans)",
                    "Figma, Design Systems, UX Research, Prototyping, Accessibilité",
                    new BigDecimal("54000"),
                    new BigDecimal("65000"),
                    LocalDate.now().minusDays(4)
                );
                o2 = offreRepository.save(o2);

                Offre o3 = createOffre(
                    comp2,
                    "Ingénieur Machine Learning & LLM Ops",
                    "Intégrez l'équipe R&D de Lumen AI afin de déployer des pipelines RAG et des modèles de langage spécialisés en production.",
                    "• Entraîner, évaluer et optimiser des modèles NLP/LLM.\n• Construire des API d'inférence robustes et superviser leur latence.\n• Collaborer avec les équipes Data Engineering sur PostgreSQL & pgvector.",
                    "• Diplôme d'ingénieur ou Master en IA / Data Science.\n• Maîtrise de Python, PyTorch, Docker et des architectures cloud.",
                    "Lyon, France",
                    "Hybride",
                    "Data & IA",
                    "CDI",
                    "Confirmé (2–5 ans)",
                    "Python, PyTorch, LLM, Docker, PostgreSQL, FastAPI",
                    new BigDecimal("58000"),
                    new BigDecimal("72000"),
                    LocalDate.now().minusDays(1)
                );
                o3 = offreRepository.save(o3);

                Offre o4 = createOffre(
                    comp3,
                    "Backend Software Engineer — Core Banking (Java / Spring)",
                    "Participez à la construction du moteur de paiement instantané de FinPulse utilisé par plus de 8 000 entreprises européennes.",
                    "• Développer des services transactionnels sécurisés avec Spring Boot 3 et PostgreSQL.\n• Garantir la résilience, l'idempotence et la traçabilité des flux financiers.\n• Écrire des tests unitaires et d'intégration rigoureux.",
                    "• Solide maîtrise de Java 21, Spring Data JPA, Flyway et PostgreSQL.\n• Intérêt pour la sécurité applicative et les systèmes distribués.",
                    "Bordeaux, France",
                    "Hybride",
                    "Ingénierie & Tech",
                    "CDI",
                    "Confirmé (3–5 ans)",
                    "Java 21, Spring Boot, PostgreSQL, Flyway, Kafka, Sécurité",
                    new BigDecimal("55000"),
                    new BigDecimal("68000"),
                    LocalDate.now().minusDays(5)
                );
                o4 = offreRepository.save(o4);

                Offre o5 = createOffre(
                    comp2,
                    "Product Manager — Plateforme Data & Analytics",
                    "Pilotez la feuille de route produit de notre suite analytique temps réel à destination des grands comptes.",
                    "• Recueillir et prioriser les besoins clients avec les équipes Sales et Customer Success.\n• Rédiger des spécifications claires et suivre les indicateurs d'adoption.\n• Coordonner les lancements produit.",
                    "• Expérience réussie de 3 ans en Product Management B2B.\n• Forte culture data, maîtrise de SQL et excellente communication.",
                    "Lyon, France",
                    "Télétravail complet",
                    "Design & Produit",
                    "CDI",
                    "Confirmé (3–5 ans)",
                    "Product Management, Agile, SQL, Analytics, Roadmap",
                    new BigDecimal("52000"),
                    new BigDecimal("64000"),
                    LocalDate.now().minusDays(6)
                );
                o5 = offreRepository.save(o5);

                Offre o6 = createOffre(
                    comp1,
                    "Stage Fin d'Études — Développeur Frontend React / TypeScript",
                    "Stage de 6 mois au sein de notre squad Expérience Utilisateur avec opportunité d'embauche en CDI à l'issue du stage.",
                    "• Développer de nouvelles fonctionnalités interactives en React 19 et TypeScript.\n• Contribuer aux animations Framer Motion et aux tests automatisés.\n• Participer aux rituels agiles de l'équipe.",
                    "• Étudiant(e) en dernière année d'école d'ingénieur ou Master informatique.\n• Bonne connaissance de React, TypeScript et Tailwind CSS.",
                    "Paris, France",
                    "Hybride",
                    "Ingénierie & Tech",
                    "Stage",
                    "Junior / Débutant",
                    "React, TypeScript, Tailwind CSS, Git, REST API",
                    new BigDecimal("21600"),
                    new BigDecimal("24000"),
                    LocalDate.now().minusDays(3)
                );
                o6 = offreRepository.save(o6);

                // 5. Applications (Candidatures)
                Candidature app1 = new Candidature();
                app1.setCandidat(cand1);
                app1.setOffre(o1);
                app1.setDateCandidature(LocalDateTime.now().minusDays(2));
                app1.setStatut(StatutCandidature.ENTRETIEN);
                app1.setLettreMotivation("Passionnée par l'écosystème Java 21 / Spring Boot et React, je souhaite mettre mes 4 années d'expérience au service de la plateforme Nova Studio.");
                app1.setCvUrlSpecifique(cand1.getCvUrl());
                app1.setNoteRecruteur("Excellent profil technique, maîtrise complète de notre stack. Entretien technique programmé.");
                app1.setScoreMatching(96);
                app1 = candidatureRepository.save(app1);

                Candidature app2 = new Candidature();
                app2.setCandidat(cand1);
                app2.setOffre(o4);
                app2.setDateCandidature(LocalDateTime.now().minusDays(4));
                app2.setStatut(StatutCandidature.EN_ATTENTE);
                app2.setLettreMotivation("Votre architecture bancaire temps réel correspond parfaitement à mon parcours sur Spring Boot et PostgreSQL.");
                app2.setCvUrlSpecifique(cand1.getCvUrl());
                app2.setScoreMatching(91);
                app2 = candidatureRepository.save(app2);

                Candidature app3 = new Candidature();
                app3.setCandidat(cand2);
                app3.setOffre(o2);
                app3.setDateCandidature(LocalDateTime.now().minusDays(3));
                app3.setStatut(StatutCandidature.ACCEPTEE);
                app3.setLettreMotivation("Créateur de deux Design Systems SaaS en production, je serais ravi de piloter le Design System de Nova Studio.");
                app3.setCvUrlSpecifique(cand2.getCvUrl());
                app3.setNoteRecruteur("Portfolio remarquable. Proposition d'embauche validée.");
                app3.setScoreMatching(94);
                app3 = candidatureRepository.save(app3);

                Candidature app4 = new Candidature();
                app4.setCandidat(cand3);
                app4.setOffre(o1);
                app4.setDateCandidature(LocalDateTime.now().minusDays(1));
                app4.setStatut(StatutCandidature.EN_ATTENTE);
                app4.setLettreMotivation("Ingénieure Data & Backend souhaitant évoluer vers un poste Full Stack à fort impact.");
                app4.setCvUrlSpecifique(cand3.getCvUrl());
                app4.setScoreMatching(79);
                app4 = candidatureRepository.save(app4);

                // 6. Interviews (Entretiens)
                Entretien ent1 = new Entretien();
                ent1.setCandidature(app1);
                ent1.setDateEntretien(LocalDateTime.now().plusDays(2).withHour(14).withMinute(30));
                ent1.setTypeEntretien("Visioconférence Architecture & Code");
                ent1.setLienOuLieu("https://meet.talentflow.io/nova-studio-marie-dubois");
                ent1.setStatut(StatutEntretien.PLANIFIE);
                ent1.setCommentaire("Échange de 45 min avec le Lead Backend et revue d'architecture Spring Boot / React.");
                entretienRepository.save(ent1);

                Entretien ent2 = new Entretien();
                ent2.setCandidature(app3);
                ent2.setDateEntretien(LocalDateTime.now().minusDays(1).withHour(11).withMinute(0));
                ent2.setTypeEntretien("Entretien Final Direction Produit");
                ent2.setLienOuLieu("42 Rue de Paradis, 75010 Paris");
                ent2.setStatut(StatutEntretien.TERMINE);
                ent2.setCommentaire("Entretien très concluant, excellente adéquation culturelle et technique.");
                entretienRepository.save(ent2);

                // 7. Favorites & Saved Searches
                favoriRepository.save(new Favori(cand1, o1));
                favoriRepository.save(new Favori(cand1, o3));

                Recherche rech = new Recherche();
                rech.setCandidat(cand1);
                rech.setMotCle("Spring Boot React");
                rech.setLocalisation("Paris");
                rech.setTypeContrat("CDI");
                rech.setCategorie("Ingénierie & Tech");
                rechercheRepository.save(rech);
            }
        };
    }

    private Offre createOffre(
        Entreprise entreprise,
        String titre,
        String description,
        String missions,
        String profil,
        String localisation,
        String modeTravail,
        String categorie,
        String typeContrat,
        String niveau,
        String competences,
        BigDecimal salaire,
        BigDecimal salaireMax,
        LocalDate datePub
    ) {
        Offre o = new Offre();
        o.setEntreprise(entreprise);
        o.setTitre(titre);
        o.setDescription(description);
        o.setMissions(missions);
        o.setProfilRecherche(profil);
        o.setLocalisation(localisation);
        o.setModeTravail(modeTravail);
        o.setCategorie(categorie);
        o.setTypeContrat(typeContrat);
        o.setNiveauExperience(niveau);
        o.setCompetencesRequises(competences);
        o.setSalaire(salaire);
        o.setSalaireMax(salaireMax);
        o.setDatePublication(datePub);
        o.setDateExpiration(datePub.plusDays(45));
        o.setStatut(StatutOffre.ACTIVE);
        return o;
    }
}
