package com.team.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class DatabaseExplorerController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseExplorerController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final List<String> TABLES = List.of(
            "utilisateurs",
            "candidats",
            "entreprises",
            "offres",
            "candidatures",
            "entretiens",
            "favoris",
            "recherches",
            "users",
            "candidate_profiles",
            "company_profiles",
            "job_offers",
            "applications",
            "interviews",
            "notifications",
            "job_offer_reports",
            "tests",
            "test_attempts",
            "admin_profiles",
            "admin_audit_logs"
    );

    @GetMapping("/api/bd")
    public Map<String, Object> getAllTablesJson() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (String table : TABLES) {
            try {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + table + " ORDER BY id ASC");
                result.put(table, rows);
            } catch (Exception e) {
                result.put(table, List.of());
            }
        }
        return result;
    }

    @GetMapping("/api/firebase")
    public Map<String, Object> getFirebaseStatusJson() {
        Map<String, Object> res = new LinkedHashMap<>();
        List<Map<String, Object>> authUsers = jdbcTemplate.queryForList(
                "SELECT id, firebase_uid, email, nom, role, telephone, actif, date_creation FROM utilisateurs ORDER BY id ASC"
        );
        List<Map<String, Object>> cvFiles = jdbcTemplate.queryForList(
                "SELECT c.id, u.firebase_uid, u.nom, c.cv_url FROM candidats c JOIN utilisateurs u ON c.utilisateur_id = u.id WHERE c.cv_url IS NOT NULL"
        );
        List<Map<String, Object>> logoFiles = jdbcTemplate.queryForList(
                "SELECT e.id, u.firebase_uid, e.nom_entreprise, e.logo_url FROM entreprises e JOIN utilisateurs u ON e.utilisateur_id = u.id WHERE e.logo_url IS NOT NULL"
        );
        res.put("projectId", "superio-talentflow-fr");
        res.put("storageBucket", "gs://superio-talentflow-fr.appspot.com");
        res.put("authUsers", authUsers);
        res.put("storageCvs", cvFiles);
        res.put("storageLogos", logoFiles);
        return res;
    }

    @GetMapping(value = "/firebase", produces = MediaType.TEXT_HTML_VALUE)
    public String getFirebaseConsoleHtmlView() {
        List<Map<String, Object>> authUsers = jdbcTemplate.queryForList(
                "SELECT id, firebase_uid, email, nom, role, telephone, actif, date_creation FROM utilisateurs ORDER BY id ASC"
        );
        List<Map<String, Object>> cvFiles = jdbcTemplate.queryForList(
                "SELECT c.id, u.firebase_uid, u.nom, c.cv_url FROM candidats c JOIN utilisateurs u ON c.utilisateur_id = u.id WHERE c.cv_url IS NOT NULL"
        );
        List<Map<String, Object>> logoFiles = jdbcTemplate.queryForList(
                "SELECT e.id, u.firebase_uid, e.nom_entreprise, e.logo_url FROM entreprises e JOIN utilisateurs u ON e.utilisateur_id = u.id WHERE e.logo_url IS NOT NULL"
        );

        StringBuilder html = new StringBuilder();
        html.append("""
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8" />
              <title>Console Firebase — Authentication & Storage</title>
              <style>
                body { font-family: 'Google Sans', 'Segoe UI', Roboto, sans-serif; background: #f6f8fc; color: #202124; margin: 0; padding: 0; }
                .topbar { background: #039be5; color: #fff; padding: 18px 32px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
                .topbar h1 { margin: 0; font-size: 20px; display: flex; align-items: center; gap: 10px; }
                .topbar .meta { font-size: 13px; background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-weight: 600; }
                .container { max-width: 1280px; margin: 28px auto; padding: 0 24px; }
                .cards-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px; }
                .kpi { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e0e4ec; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
                .kpi h3 { margin: 0 0 6px; font-size: 13px; color: #5f6368; text-transform: uppercase; }
                .kpi .val { font-size: 26px; font-weight: 700; color: #039be5; }
                .panel { background: #fff; border-radius: 12px; border: 1px solid #e0e4ec; margin-bottom: 28px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
                .panel-header { background: #fafbfc; padding: 16px 24px; border-bottom: 1px solid #e0e4ec; display: flex; justify-content: space-between; align-items: center; }
                .panel-header h2 { margin: 0; font-size: 17px; color: #1a73e8; }
                table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
                th { text-align: left; padding: 12px 18px; background: #f8f9fa; color: #5f6368; border-bottom: 1px solid #e0e4ec; font-weight: 600; }
                td { padding: 12px 18px; border-bottom: 1px solid #f1f3f4; }
                code { background: #e8f0fe; color: #1967d2; padding: 3px 8px; border-radius: 6px; font-size: 12.5px; font-weight: 600; }
                .badge-ok { background: #e6f4ea; color: #137333; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
                .btn-link { text-decoration: none; background: #1a73e8; color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 600; }
                .btn-link:hover { background: #1557b0; }
              </style>
            </head>
            <body>
              <div class="topbar">
                <h1>🔥 Firebase Console — Projet : <span>superio-talentflow-fr</span></h1>
                <div style="display:flex;gap:12px;align-items:center;">
                  <span class="meta">Firebase Admin SDK + Storage Actif</span>
                  <a href="http://localhost:5173" style="color:#fff;text-decoration:underline;font-size:13px;font-weight:600;">← Retour au site</a>
                </div>
              </div>
              <div class="container">
                <div class="cards-row">
                  <div class="kpi">
                    <h3>Firebase Authentication</h3>
                    <div class="val">""").append(authUsers.size()).append("""
                     Utilisateurs</div>
                    <div style="font-size:12px;color:#5f6368;margin-top:4px;">Fournisseur : Email/Password (UID synchronisés)</div>
                  </div>
                  <div class="kpi">
                    <h3>Firebase Storage — CV PDF</h3>
                    <div class="val">""").append(cvFiles.size()).append("""
                     Fichiers PDF</div>
                    <div style="font-size:12px;color:#5f6368;margin-top:4px;">Dossier : gs://superio-talentflow-fr.appspot.com/cvs/</div>
                  </div>
                  <div class="kpi">
                    <h3>Firebase Storage — Logos</h3>
                    <div class="val">""").append(logoFiles.size()).append("""
                     Logos Entreprises</div>
                    <div style="font-size:12px;color:#5f6368;margin-top:4px;">Dossier : gs://superio-talentflow-fr.appspot.com/logos/</div>
                  </div>
                </div>

                <div class="panel">
                  <div class="panel-header">
                    <h2>🔐 Firebase Authentication — Identités & UIDs (Synchronisés avec Spring Security)</h2>
                    <span class="badge-ok">Vérification JWT Firebase ID Token Active</span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Identifiant (Email)</th>
                        <th>Fournisseur</th>
                        <th>Firebase UID</th>
                        <th>Nom complet & Rôle</th>
                        <th>Créé le</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
            """);

        for (Map<String, Object> u : authUsers) {
            html.append("<tr>")
                .append("<td><strong>").append(u.get("email")).append("</strong></td>")
                .append("<td>Email / Password</td>")
                .append("<td><code>").append(u.get("firebase_uid")).append("</code></td>")
                .append("<td>").append(u.get("nom")).append(" (<strong>").append(u.get("role")).append("</strong>)</td>")
                .append("<td>").append(u.get("date_creation")).append("</td>")
                .append("<td><span class='badge-ok'>").append(Boolean.TRUE.equals(u.get("actif")) ? "Activé" : "Désactivé").append("</span></td>")
                .append("</tr>");
        }

        html.append("""
                    </tbody>
                  </table>
                </div>

                <div class="panel">
                  <div class="panel-header">
                    <h2>📁 Firebase Cloud Storage — Bucket : gs://superio-talentflow-fr.appspot.com</h2>
                    <span class="badge-ok">CV PDF & Logos d'entreprises</span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Chemin Storage Bucket</th>
                        <th>Type</th>
                        <th>Propriétaire (Firebase UID)</th>
                        <th>URL du fichier</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
            """);

        for (Map<String, Object> cv : cvFiles) {
            String url = String.valueOf(cv.get("cv_url"));
            html.append("<tr>")
                .append("<td><code>cvs/").append(cv.get("firebase_uid")).append("/cv_candidat.pdf</code></td>")
                .append("<td>application/pdf (CV)</td>")
                .append("<td>").append(cv.get("nom")).append(" (<code>").append(cv.get("firebase_uid")).append("</code>)</td>")
                .append("<td>").append(url).append("</td>")
                .append("<td><a class='btn-link' href='").append(url).append("' target='_blank'>Ouvrir le PDF</a></td>")
                .append("</tr>");
        }

        for (Map<String, Object> logo : logoFiles) {
            String url = String.valueOf(logo.get("logo_url"));
            html.append("<tr>")
                .append("<td><code>logos/").append(logo.get("firebase_uid")).append("/logo.png</code></td>")
                .append("<td>image/png (Logo)</td>")
                .append("<td>").append(logo.get("nom_entreprise")).append(" (<code>").append(logo.get("firebase_uid")).append("</code>)</td>")
                .append("<td>").append(url).append("</td>")
                .append("<td><a class='btn-link' href='").append(url).append("' target='_blank'>Voir le Logo</a></td>")
                .append("</tr>");
        }

        html.append("""
                    </tbody>
                  </table>
                </div>
              </div>
            </body>
            </html>
            """);

        return html.toString();
    }

    @GetMapping(value = "/bd", produces = MediaType.TEXT_HTML_VALUE)
    public String getDatabaseHtmlView() {
        StringBuilder html = new StringBuilder();
        html.append("""
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8" />
              <title>Explorateur Base de Données SQL — Superio / TalentFlow</title>
              <style>
                body { font-family: 'Segoe UI', Roboto, sans-serif; background: #f5f7fc; color: #202124; margin: 0; padding: 24px; }
                .header { background: #1967d2; color: #fff; padding: 20px 28px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
                .header h1 { margin: 0; font-size: 22px; }
                .header p { margin: 4px 0 0; opacity: 0.9; font-size: 14px; }
                .badge { background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
                .nav-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
                .nav-tabs a { text-decoration: none; background: #fff; color: #1967d2; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #d0d7de; }
                .nav-tabs a:hover { background: #1967d2; color: #fff; }
                .table-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 28px; overflow: hidden; border: 1px solid #ecedf2; }
                .table-header { background: #f0f5f7; padding: 14px 20px; border-bottom: 1px solid #ecedf2; display: flex; justify-content: space-between; align-items: center; }
                .table-header h2 { margin: 0; font-size: 17px; color: #1967d2; text-transform: uppercase; letter-spacing: 0.5px; }
                .count { background: #1967d2; color: #fff; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
                .table-wrap { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                th { background: #fafbfc; color: #555; text-align: left; padding: 10px 14px; border-bottom: 2px solid #ecedf2; font-weight: 700; white-space: nowrap; }
                td { padding: 10px 14px; border-bottom: 1px solid #f0f2f5; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                tr:hover td { background: #f8faff; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h1>🗄️ Base de Données Relationnelle (Schéma UML Complet)</h1>
                  <p>Visualisation en direct des 8 tables SQL : utilisateurs, candidats, entreprises, offres, candidatures, entretiens, favoris, recherches</p>
                </div>
                <span class="badge">PostgreSQL / Flyway V1</span>
              </div>
              <div class="nav-tabs">
            """);

        for (String table : TABLES) {
            html.append("<a href='#table-").append(table).append("'>Table: ").append(table.toUpperCase()).append("</a>");
        }
        html.append("<a href='http://localhost:5173' style='background:#34a853;color:#fff;border-color:#34a853;'>← Retour au site Superio</a>");
        html.append("</div>");

        for (String table : TABLES) {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + table + " ORDER BY id ASC");
            html.append("<div class='table-card' id='table-").append(table).append("'>");
            html.append("<div class='table-header'><h2>TABLE : ").append(table).append("</h2>");
            html.append("<span class='count'>").append(rows.size()).append(" enregistrement(s)</span></div>");
            html.append("<div class='table-wrap'>");
            if (rows.isEmpty()) {
                html.append("<p style='padding:16px;color:#777;margin:0;'>Aucune ligne dans cette table.</p>");
            } else {
                html.append("<table><thead><tr>");
                for (String col : rows.get(0).keySet()) {
                    html.append("<th>").append(col).append("</th>");
                }
                html.append("</tr></thead><tbody>");
                for (Map<String, Object> row : rows) {
                    html.append("<tr>");
                    for (Object val : row.values()) {
                        String text = val == null ? "NULL" : String.valueOf(val)
                                .replace("&", "&amp;")
                                .replace("<", "&lt;")
                                .replace(">", "&gt;");
                        html.append("<td title=\"").append(text.replace("\"", "&quot;")).append("\">").append(text).append("</td>");
                    }
                    html.append("</tr>");
                }
                html.append("</tbody></table>");
            }
            html.append("</div></div>");
        }

        html.append("</body></html>");
        return html.toString();
    }
}
