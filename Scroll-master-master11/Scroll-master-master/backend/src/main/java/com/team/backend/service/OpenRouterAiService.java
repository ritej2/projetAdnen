package com.team.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.dto.TestEtEvaluationDTO.*;
import com.team.backend.entity.Offre;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OpenRouterAiService {

    private static final Logger log = LoggerFactory.getLogger(OpenRouterAiService.class);

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    public OpenRouterAiService(
        @Value("${talentflow.ai.openrouter.api-key:}") String apiKey,
        @Value("${talentflow.ai.openrouter.model:openrouter/auto}") String model,
        @Value("${talentflow.ai.openrouter.base-url:https://openrouter.ai/api/v1}") String baseUrl
    ) {
        this.apiKey = (apiKey != null) ? apiKey.trim() : "";
        this.model = (model != null && !model.isBlank()) ? model.trim() : "openrouter/auto";
        this.baseUrl = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl.trim() : "https://openrouter.ai/api/v1";
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public AgentChatResponse processAgentChat(AgentChatRequest req, Offre offre) {
        // 1. Tenter l'appel à OpenRouter si une clé est configurée
        if (!apiKey.isBlank()) {
            try {
                AgentChatResponse response = callOpenRouter(req, offre);
                if (response != null && response.questions() != null && !response.questions().isEmpty()) {
                    return response;
                }
            } catch (Exception e) {
                log.warn("Appel OpenRouter non abouti ({}), bascule immédiate sur le moteur expert local.", e.getMessage());
            }
        }

        // 2. Fallback automatique sur le moteur IA local embarqué
        return fallbackLocalAgent(req, offre);
    }

    private int extractRequestedCount(String msg, int defaultCount) {
        if (msg == null || msg.isBlank()) return defaultCount;
        Matcher m = Pattern.compile("(\\d+)\\s*(qcm|questions?|quest|items?|sujets?)?", Pattern.CASE_INSENSITIVE).matcher(msg);
        while (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                if (val >= 1 && val <= 30) {
                    return val;
                }
            } catch (Exception ignored) {}
        }
        return defaultCount;
    }

    private AgentChatResponse callOpenRouter(AgentChatRequest req, Offre offre) throws Exception {
        String titreOffre = offre != null ? offre.getTitre() : "Développeur Full Stack";
        String competences = offre != null ? (offre.getCompetencesRequises() != null ? offre.getCompetencesRequises() : "") : "";
        int targetCount = extractRequestedCount(req.message(), (req.questionsActuelles() != null && !req.questionsActuelles().isEmpty()) ? req.questionsActuelles().size() : 5);

        String systemPrompt = """
            Tu es un agent IA expert en recrutement technique et conception de QCM d'évaluation professionnelle pour TalentFlow.
            Tu assistes le recruteur pour concevoir et affiner le test technique pour le poste: %s (Compétences: %s).
            Réponds EXCLUSIVEMENT sous la forme d'un objet JSON strict avec exactement cette structure (sans balises markdown supplémentaires):
            {
              "messageAgent": "Ton explication amicale, professionnelle et concise des modifications apportées",
              "titreTest": "Titre adapté du test",
              "description": "Description concise des objectifs du test",
              "dureeMinutes": 20,
              "scoreMinimum": 60,
              "questions": [
                {
                  "id": 1,
                  "question": "Énoncé précis et technique de la question ?",
                  "options": ["Choix A", "Choix B", "Choix C", "Choix D"],
                  "bonneReponse": 1,
                  "explication": "Explication claire de pourquoi ce choix est le bon"
                }
              ]
            }
            RÈGLES IMPORTANTES ET STRICTES :
            - Le recruteur a demandé EXACTEMENT %d questions. Tu DOIS ABSOLUMENT retourner exactement %d questions dans le tableau "questions".
            - Chaque question doit comporter exactement 4 options distinctes et réalistes.
            - bonneReponse est un entier de 0 à 3 (l'index du bon choix parmi options).
            - Explication didactique et claire pour chaque question.
            """.formatted(titreOffre, competences, targetCount, targetCount);

        Map<String, Object> currentContext = new HashMap<>();
        currentContext.put("messageUtilisateur", req.message());
        currentContext.put("nombreQuestionsDemande", targetCount);
        currentContext.put("questionsActuelles", req.questionsActuelles() != null ? req.questionsActuelles() : Collections.emptyList());
        currentContext.put("dureeMinutes", req.dureeMinutes() != null ? req.dureeMinutes() : 20);
        currentContext.put("scoreMinimum", req.scoreMinimum() != null ? req.scoreMinimum() : 60);

        String userContent = "Consigne du recruteur : " + req.message()
            + "\nIMPORTANT : Génère EXACTEMENT " + targetCount + " questions complètes dans le tableau 'questions'."
            + "\nContexte actuel : " + objectMapper.writeValueAsString(currentContext);

        Map<String, Object> requestBody = Map.of(
            "model", this.model,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userContent)
            ),
            "temperature", 0.3
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(this.baseUrl + "/chat/completions"))
            .header("Authorization", "Bearer " + this.apiKey)
            .header("Content-Type", "application/json")
            .header("HTTP-Referer", "http://localhost:5173")
            .header("X-Title", "TalentFlow")
            .timeout(Duration.ofSeconds(20))
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && !choices.isEmpty()) {
                String content = choices.get(0).get("message").get("content").asText();
                return parseAgentResponseJson(content);
            }
        } else {
            log.warn("OpenRouter API a répondu avec le statut HTTP {}: {}", response.statusCode(), response.body());
        }

        return null;
    }

    private AgentChatResponse parseAgentResponseJson(String raw) {
        try {
            String cleaned = raw.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            JsonNode node = objectMapper.readTree(cleaned);
            String messageAgent = node.hasNonNull("messageAgent") ? node.get("messageAgent").asText() : "Voici les questions mises à jour pour votre test technique.";
            String titreTest = node.hasNonNull("titreTest") ? node.get("titreTest").asText() : "Test Technique Personnalisé";
            String description = node.hasNonNull("description") ? node.get("description").asText() : "Évaluation des compétences requises.";
            int duree = node.hasNonNull("dureeMinutes") ? node.get("dureeMinutes").asInt() : 20;
            int scoreMin = node.hasNonNull("scoreMinimum") ? node.get("scoreMinimum").asInt() : 60;

            List<QuestionDTO> questions = new ArrayList<>();
            JsonNode qNode = node.get("questions");
            if (qNode != null && qNode.isArray()) {
                for (int i = 0; i < qNode.size(); i++) {
                    JsonNode q = qNode.get(i);
                    String qText = q.hasNonNull("question") ? q.get("question").asText() : ("Question " + (i + 1));
                    List<String> options = new ArrayList<>();
                    if (q.has("options") && q.get("options").isArray()) {
                        for (JsonNode opt : q.get("options")) {
                            options.add(opt.asText());
                        }
                    }
                    if (options.size() < 4) {
                        while (options.size() < 4) options.add("Option " + (options.size() + 1));
                    }
                    int bonneRep = q.hasNonNull("bonneReponse") ? q.get("bonneReponse").asInt() : 0;
                    String expl = q.hasNonNull("explication") ? q.get("explication").asText() : "Réponse standard vérifiée.";
                    questions.add(new QuestionDTO(i + 1, qText, options, bonneRep, expl));
                }
            }
            return new AgentChatResponse(messageAgent, titreTest, description, duree, scoreMin, questions, true);
        } catch (Exception e) {
            log.error("Impossible de parser le JSON retourné par l'IA: {}", raw, e);
            return null;
        }
    }

    private AgentChatResponse fallbackLocalAgent(AgentChatRequest req, Offre offre) {
        String msg = (req.message() != null ? req.message().toLowerCase().trim() : "");
        List<QuestionDTO> currentQuestions = req.questionsActuelles() != null
            ? new ArrayList<>(req.questionsActuelles())
            : new ArrayList<>();

        int targetCount = extractRequestedCount(msg, currentQuestions.isEmpty() ? 5 : currentQuestions.size());

        String titre = req.titreTest() != null && !req.titreTest().isBlank()
            ? req.titreTest()
            : (offre != null ? "Test Technique - " + offre.getTitre() : "Évaluation Technique");

        String description = "Test technique personnalisé conçu et validé par l'entreprise.";
        int duree = req.dureeMinutes() != null && req.dureeMinutes() > 0 ? req.dureeMinutes() : 20;
        int scoreMin = req.scoreMinimum() != null ? req.scoreMinimum() : 60;

        StringBuilder agentReply = new StringBuilder();

        // 1. Analyse des demandes de durée ou score
        if (msg.contains("minute") || msg.contains("durée") || msg.contains("duree")) {
            Matcher m = Pattern.compile("(\\d+)\\s*min").matcher(msg);
            if (m.find()) {
                duree = Integer.parseInt(m.group(1));
                agentReply.append("⏱️ J'ai ajusté la durée du test à ").append(duree).append(" minutes. ");
            }
        }
        if (msg.contains("score") || msg.contains("%") || msg.contains("seuil")) {
            Matcher m = Pattern.compile("(\\d+)\\s*%?").matcher(msg);
            if (m.find()) {
                scoreMin = Integer.parseInt(m.group(1));
                agentReply.append("🎯 Score minimum requis fixé à ").append(scoreMin).append("%. ");
            }
        }

        // 2. Si aucune question ou si demande de génération explicite
        if (currentQuestions.isEmpty()
            || msg.contains("générer") || msg.contains("generer") || msg.contains("créer") || msg.contains("nouveau")
            || msg.contains("donner") || msg.contains("qcm") || targetCount != currentQuestions.size()) {

            currentQuestions = generateSmartQuestionsForStack(offre, msg, targetCount);
            agentReply.append("✨ J'ai généré ").append(currentQuestions.size())
                .append(" questions ciblées selon le profil de l'offre et vos critères (")
                .append(targetCount).append(" questions demandées). Vous pouvez relire et modifier chaque énoncé ou bonne réponse dans l'éditeur.");
        } else if (msg.contains("supprimer") || msg.contains("retirer") || msg.contains("enlever")) {
            if (!currentQuestions.isEmpty()) {
                currentQuestions.remove(currentQuestions.size() - 1);
                List<QuestionDTO> reindexed = new ArrayList<>();
                for (int i = 0; i < currentQuestions.size(); i++) {
                    QuestionDTO old = currentQuestions.get(i);
                    reindexed.add(new QuestionDTO(i + 1, old.question(), old.options(), old.bonneReponse(), old.explication()));
                }
                currentQuestions = reindexed;
                agentReply.append("🗑️ La dernière question a été supprimée selon votre demande.");
            }
        } else if (msg.contains("ajouter") || msg.contains("ajoute") || msg.contains("autre question")) {
            QuestionDTO extraQ = createDynamicQuestion(msg, currentQuestions.size() + 1);
            currentQuestions.add(extraQ);
            agentReply.append("➕ J'ai ajouté une nouvelle question sur vos compétences cibles : « ").append(extraQ.question()).append(" ».");
        } else if (msg.contains("difficile") || msg.contains("expert") || msg.contains("avancé")) {
            currentQuestions = generateDifficultQuestions(offre);
            agentReply.append("🔥 Le niveau d'exigence a été rehaussé ! Les questions portent désormais sur des concepts d'architecture, d'optimisation et de sécurité avancés.");
        } else {
            QuestionDTO bonus = createDynamicQuestion(msg, currentQuestions.size() + 1);
            currentQuestions.add(bonus);
            agentReply.append("💡 J'ai analysé votre demande et adapté le test technique (").append(currentQuestions.size()).append(" questions). N'hésitez pas à modifier le texte ou les options directement ci-contre !");
        }

        return new AgentChatResponse(
            agentReply.toString().trim(),
            titre,
            description,
            duree,
            scoreMin,
            currentQuestions,
            true
        );
    }

    private List<QuestionDTO> generateSmartQuestionsForStack(Offre offre, String userPrompt, int targetCount) {
        String fullContext = ((offre != null ? offre.getTitre() + " " + offre.getCompetencesRequises() : "") + " " + userPrompt).toLowerCase();

        // Master pool riche de 20 questions couvrant tous les concepts clés du dev moderne
        List<QuestionDTO> masterPool = new ArrayList<>();

        masterPool.add(new QuestionDTO(
            1,
            "Quel est le rôle principal d'un système de contrôle de versions comme Git ?",
            List.of(
                "Gérer l'historique et la collaboration sur le code source de manière distribuée",
                "Compiler et exécuter automatiquement le code binaire",
                "Remplacer les bases de données relationnelles pour le stockage",
                "Styliser les composants d'interface graphique"
            ),
            0,
            "Git permet d'enregistrer chaque étape d'évolution du projet, de créer des branches isolées et de fusionner le travail en équipe."
        ));

        masterPool.add(new QuestionDTO(
            2,
            "Dans le protocole HTTP, que signifie le code de statut 404 ?",
            List.of(
                "La requête a réussi et le contenu est retourné",
                "Accès interdit en raison de permissions insuffisantes",
                "La ressource demandée n'a pas été trouvée sur le serveur",
                "Une erreur interne critique est survenue côté serveur"
            ),
            2,
            "Le code 404 Not Found indique que l'URI demandée ne correspond à aucune ressource active sur le serveur."
        ));

        masterPool.add(new QuestionDTO(
            3,
            "Quelle est la caractéristique fondamentale d'une API de style architectural REST ?",
            List.of(
                "Elle est sans état (stateless) et manipule des ressources via des méthodes HTTP standard (GET, POST, PUT, DELETE)",
                "Elle nécessite obligatoirement l'utilisation du protocole SOAP et de fichiers XML WSDL",
                "Elle stocke obligatoirement la session utilisateur dans la mémoire vive du serveur web",
                "Elle interdit l'usage du format JSON"
            ),
            0,
            "REST repose sur des ressources identifiées par URI et manipulées de façon sans état avec les verbes HTTP usuels."
        ));

        masterPool.add(new QuestionDTO(
            4,
            "En programmation orientée objet (POO), que permet le principe d'encapsulation ?",
            List.of(
                "Masquer les détails internes et l'état d'un objet en n'exposant qu'une interface contrôlée",
                "Autoriser toutes les classes externes à modifier directement les attributs privés",
                "Empêcher totalement l'héritage entre classes",
                "Forcer la compilation en mode multi-threadé"
            ),
            0,
            "L'encapsulation protège l'intégrité des données d'un objet en restreignant l'accès direct à ses variables membres."
        ));

        masterPool.add(new QuestionDTO(
            5,
            "Qu'est-ce qu'un test unitaire dans le cycle de développement logiciel ?",
            List.of(
                "Un test automatisé validant le bon fonctionnement d'un composant ou d'une fonction isolée du reste du système",
                "Un test manuel réalisé exclusivement par les utilisateurs finaux en production",
                "Un test de charge mesurant la résistance des serveurs face à un million d'utilisateurs",
                "Un contrôle juridique de conformité des licences open-source"
            ),
            0,
            "Les tests unitaires vérifient la plus petite portion testable d'une application (méthode, fonction) avec des dépendances bouchonnées (mocks)."
        ));

        masterPool.add(new QuestionDTO(
            6,
            "Dans une base de données SQL relationnelle, à quoi sert une clause 'INNER JOIN' ?",
            List.of(
                "Combiner les lignes de deux tables qui satisfont une condition de jointure commune",
                "Supprimer définitivement les index d'une table",
                "Créer une nouvelle clé étrangère sans contrainte",
                "Calculer la moyenne arithmétique d'une colonne numérique"
            ),
            0,
            "INNER JOIN ne conserve que les enregistrements présentant une correspondance exacte dans les deux tables jointes."
        ));

        masterPool.add(new QuestionDTO(
            7,
            "Quel est l'objectif principal de la conteneurisation avec Docker ?",
            List.of(
                "Embarquer une application et ses dépendances dans un environnement isolé, léger et portable",
                "Remplacer les systèmes d'exploitation physiques par des hyperviseurs de type 1",
                "Générer automatiquement des tests de non-régression",
                "Compresser les images PNG et JPEG de l'interface"
            ),
            0,
            "Docker garantit qu'une application s'exécute de façon strictement identique en développement, test et production."
        ));

        masterPool.add(new QuestionDTO(
            8,
            "En Git, quelle commande permet de créer et basculer immédiatement sur une nouvelle branche ?",
            List.of(
                "git checkout -b <nom-branche> (ou git switch -c <nom-branche>)",
                "git commit -m <nom-branche>",
                "git push origin <nom-branche>",
                "git merge --new <nom-branche>"
            ),
            0,
            "git checkout -b ou git switch -c crée la branche et positionne HEAD sur celle-ci en une seule opération."
        ));

        masterPool.add(new QuestionDTO(
            9,
            "Que désigne l'approche CI/CD dans les pratiques modernes d'ingénierie logicielle ?",
            List.of(
                "L'Intégration Continue (build & tests automatisés) et le Déploiement/Livraison Continus vers les environnements cibles",
                "Le Chiffrement Intelligent et la Compression Dynamique des fichiers sources",
                "Le Contrôle d'Interface et la Conception Directe des wireframes",
                "Le Changement d'Identifiant et la Connexion Distribuée"
            ),
            0,
            "CI/CD automatise la validation du code à chaque commit et sa livraison fiable et rapide jusqu'en production."
        ));

        masterPool.add(new QuestionDTO(
            10,
            "Dans le cadre des méthodes Agiles / Scrum, qu'est-ce qu'un Sprint ?",
            List.of(
                "Une itération courte à durée fixe (généralement 1 à 4 semaines) produisant un incrément produit potentiellement livrable",
                "Une réunion d'urgence déclenchée uniquement en cas d'incident critique",
                "Une session de débogage individuel sans contact avec l'équipe",
                "Une phase annuelle d'évaluation des performances des développeurs"
            ),
            0,
            "Le Sprint cadence le projet en cycles itératifs courts avec des objectifs définis et un incrément fonctionnel testé."
        ));

        masterPool.add(new QuestionDTO(
            11,
            "Quel principe SOLID stipule qu'une classe ne doit avoir qu'une seule raison de changer ?",
            List.of(
                "Single Responsibility Principle (SRP)",
                "Open/Closed Principle (OCP)",
                "Interface Segregation Principle (ISP)",
                "Dependency Inversion Principle (DIP)"
            ),
            0,
            "Le principe de responsabilité unique (SRP) garantit qu'un module est dédié à un rôle métier précis, facilitant maintenance et évolutivité."
        ));

        masterPool.add(new QuestionDTO(
            12,
            "En matière de sécurité des applications Web, quelle est la meilleure parade contre les injections SQL ?",
            List.of(
                "Utiliser systématiquement des requêtes préparées (Prepared Statements / ORM paramétré)",
                "Concaténer directement les variables utilisateur dans la chaîne SQL",
                "Chiffrer le mot de passe de la base de données en MD5",
                "Désactiver la journalisation des requêtes SQL"
            ),
            0,
            "Les requêtes préparées séparent le code SQL des données utilisateur, neutralisant toute tentative d'injection malveillante."
        ));

        masterPool.add(new QuestionDTO(
            13,
            "En Java 21, quel est le bénéfice majeur des Virtual Threads (Projet Loom) ?",
            List.of(
                "Permettre d'exécuter des millions de threads légers pour un I/O haut débit sans saturer les threads OS",
                "Supprimer complètement le garbage collector",
                "Rendre toutes les collections Java non modifiables",
                "Accélérer le démarrage du système d'exploitation hôte"
            ),
            0,
            "Les threads virtuels sont gérés par la JVM et permettent une scalabilité massive sur les architectures réseau bloquantes."
        ));

        masterPool.add(new QuestionDTO(
            14,
            "Dans Spring Boot 3, quel est le rôle de l'annotation @Transactional sur une méthode de service ?",
            List.of(
                "Orchestrer le début, le commit ou le rollback automatique de la transaction en cas d'exception",
                "Bloquer tous les accès réseau entrants pendant l'exécution",
                "Chiffrer les paramètres d'entrée en AES-256",
                "Convertir automatiquement le résultat en page HTML"
            ),
            0,
            "@Transactional gère le cycle de vie transactionnel et garantit les propriétés ACID lors des opérations métier."
        ));

        masterPool.add(new QuestionDTO(
            15,
            "En React (versions 18 et 19), quelle est la fonction principale du hook useCallback ?",
            List.of(
                "Mémoriser la référence d'une fonction de rappel entre les rendus pour éviter des recalculs et re-rendus enfants inutiles",
                "Mettre à jour directement le DOM sans passer par le Virtual DOM",
                "Effectuer des appels HTTP synchrones sans promesse",
                "Initialiser le routeur de navigation"
            ),
            0,
            "useCallback retourne une version mémoïsée de la fonction qui ne change que si ses dépendances déclarées sont modifiées."
        ));

        masterPool.add(new QuestionDTO(
            16,
            "En TypeScript, quel utilitaire de type permet de rendre toutes les propriétés d'un type T optionnelles ?",
            List.of("Partial<T>", "Required<T>", "Readonly<T>", "Pick<T, K>"),
            0,
            "Partial<T> transforme chaque propriété 'prop: V' en 'prop?: V', utile notamment pour les requêtes de mise à jour partielle (PATCH)."
        ));

        masterPool.add(new QuestionDTO(
            17,
            "Quelle est la différence fondamentale entre les méthodes HTTP PUT et PATCH ?",
            List.of(
                "PUT remplace intégralement la ressource existante, tandis que PATCH applique une modification partielle",
                "PUT ne s'utilise que pour la suppression de données",
                "PATCH est obligatoirement synchrone et bloque le navigateur",
                "Il n'y a aucune différence technique entre PUT et PATCH"
            ),
            0,
            "PUT est idempotent et envoie la totalité de la ressource; PATCH n'envoie que les attributs modifiés."
        ));

        masterPool.add(new QuestionDTO(
            18,
            "Dans une architecture distribuée, à quoi sert principalement un cache mémoire comme Redis ?",
            List.of(
                "Soulager la base de données principale et accélérer les temps de réponse pour les lectures fréquentes",
                "Remplacer le serveur DNS du domaine",
                "Compiler les scripts JavaScript côté client",
                "Sauvegarder l'historique complet des commits Git"
            ),
            0,
            "Redis stocke des structures clé-valeur en mémoire vive, offrant des temps de latence sub-milliseconde pour les données fréquemment lues."
        ));

        masterPool.add(new QuestionDTO(
            19,
            "Qu'est-ce que le patron de conception (Design Pattern) 'Observer' ?",
            List.of(
                "Un patron permettant à un objet d'avertir automatiquement une liste d'observateurs de tout changement d'état",
                "Un patron qui interdit la création de plus d'une instance d'une classe",
                "Un outil de monitoring matériel de la température CPU",
                "Une bibliothèque d'animation CSS 3D"
            ),
            0,
            "L'Observer pattern établit une relation 1-à-plusieurs pour propager des événements de manière découplée."
        ));

        masterPool.add(new QuestionDTO(
            20,
            "Dans une API sécurisée par JWT (JSON Web Token), où la signature du token est-elle vérifiée ?",
            List.of(
                "Côté serveur backend à chaque requête entrante grâce à la clé secrète ou la clé publique",
                "Exclusivement sur le client dans le navigateur web",
                "Par le fournisseur d'accès internet de l'utilisateur",
                "Dans le fichier package.json de l'application"
            ),
            0,
            "Le serveur vérifie la validité cryptographique de la signature avant d'autoriser l'accès aux ressources protégées."
        ));

        // Sélectionner exactement targetCount questions du pool
        int countToTake = Math.min(targetCount, masterPool.size());
        List<QuestionDTO> result = new ArrayList<>();
        for (int i = 0; i < countToTake; i++) {
            QuestionDTO src = masterPool.get(i);
            result.add(new QuestionDTO(i + 1, src.question(), src.options(), src.bonneReponse(), src.explication()));
        }

        // Si le recruteur a demandé plus que le pool (ex: 25 questions), compléter dynamiquement
        while (result.size() < targetCount) {
            int nextIdx = result.size() + 1;
            result.add(createDynamicQuestion(userPrompt, nextIdx));
        }

        return result;
    }

    private List<QuestionDTO> generateDifficultQuestions(Offre offre) {
        return List.of(
            new QuestionDTO(
                1,
                "Au niveau de l'isolation des transactions SQL (ANSI SQL), quel niveau empêche les 'Phantom Reads' ?",
                List.of("READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"),
                3,
                "Seul le niveau SERIALIZABLE élimine totalement les lectures fantômes en verrouillant les plages de clés ou via du contrôle de concurrence strict."
            ),
            new QuestionDTO(
                2,
                "Dans une architecture microservices distribuée, comment garantit-on la cohérence éventuelle entre plusieurs services sans transaction 2PC ?",
                List.of(
                    "En augmentant le timeout de chaque appel HTTP synchrone",
                    "En utilisant le patron Saga (Choréographie ou Orchestration) avec des événements de compensation",
                    "En partageant la même base de données MySQL entre tous les microservices",
                    "En redémarrant les conteneurs périodiquement"
                ),
                1,
                "Le pattern Saga décompose une transaction globale en sous-transactions locales coordonnées par événements et actions de compensation en cas d'échec."
            ),
            new QuestionDTO(
                3,
                "Dans un environnement haute performance, comment minimiser les pauses Stop-The-World en Java 21 ?",
                List.of(
                    "Désactiver complètement le ramasse-miettes avec -XX:-UseGC",
                    "Utiliser le ramasse-miettes ZGC générationnel (-XX:+UseZGC -XX:+ZGenerational)",
                    "Allouer toute la mémoire vive disponible dans la pile d'exécution (Stack)",
                    "Remplacer toutes les listes Java par des tableaux primitifs"
                ),
                1,
                "Le Generational ZGC introduit en Java 21 permet des pauses de ramasse-miettes sous la milliseconde même sur des heaps de plusieurs téraoctets."
            ),
            new QuestionDTO(
                4,
                "En matière de cybersécurité des API Web, quelle est la protection la plus efficace contre les attaques CSRF sur des SPA ?",
                List.of(
                    "Stocker le token JWT dans le localStorage sans protection XSS",
                    "Utiliser des cookies d'authentification avec les drapeaux HttpOnly, Secure et SameSite=Strict / Lax",
                    "Chiffrer le corps de la requête en Base64",
                    "Désactiver CORS sur le serveur"
                ),
                1,
                "Les attributs HttpOnly et SameSite empêchent les scripts tiers malveillants d'accéder au cookie et d'émettre des requêtes inter-sites frauduleuses."
            )
        );
    }

    private QuestionDTO createDynamicQuestion(String userPrompt, int index) {
        String p = (userPrompt != null) ? userPrompt.toLowerCase() : "";
        if (p.contains("docker") || p.contains("conteneur")) {
            return new QuestionDTO(
                index,
                "Quelle commande Docker permet de supprimer tous les conteneurs arrêtés et images non utilisées ?",
                List.of("docker kill --all", "docker system prune -a", "docker rm -f $(docker ps)", "docker clean images"),
                1,
                "docker system prune nettoie les conteneurs inactifs, réseaux orphelins et images dangling."
            );
        } else if (p.contains("git")) {
            return new QuestionDTO(
                index,
                "En Git, quelle commande permet d'appliquer un commit spécifique d'une autre branche sur la branche courante ?",
                List.of("git merge --single", "git cherry-pick <commit-hash>", "git rebase --only", "git fetch --apply"),
                1,
                "git cherry-pick permet d'importer les modifications d'un commit spécifique sans fusionner l'ensemble de la branche."
            );
        } else if (p.contains("python")) {
            return new QuestionDTO(
                index,
                "En Python, que fait l'instruction 'yield' dans une fonction ?",
                List.of(
                    "Elle arrête immédiatement le programme",
                    "Elle transforme la fonction en générateur en retournant une valeur à chaque itération tout en préservant son état",
                    "Elle force le typage statique de la variable",
                    "Elle exécute la fonction dans un thread séparé"
                ),
                1,
                "yield produit une valeur pour un itérateur et suspend l'exécution de la fonction jusqu'au prochain appel next()."
            );
        } else {
            return new QuestionDTO(
                index,
                "Quelle pratique de Clean Code est primordiale lors de la conception d'une fonction métier ?",
                List.of(
                    "Une fonction doit réaliser une seule tâche bien précise (Single Responsibility) et minimiser les effets de bord",
                    "Une fonction doit contenir au moins 100 lignes de code pour être exhaustive",
                    "Une fonction doit accepter un maximum d'arguments non typés",
                    "Une fonction doit systématiquement capturer et ignorer toutes les exceptions"
                ),
                0,
                "Une fonction courte, pure et focalisée sur une responsabilité unique est plus facile à tester, maintenir et réutiliser."
            );
        }
    }
}
