package com.team.backend.controller;

import com.team.backend.dto.TestEtEvaluationDTO.*;
import com.team.backend.service.TestEtEvaluationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations-tests")
public class TestEtEvaluationController {

    private final TestEtEvaluationService service;

    public TestEtEvaluationController(TestEtEvaluationService service) {
        this.service = service;
    }

    // =========================================================================
    // TESTS TECHNIQUES (Entreprise & Candidat)
    // =========================================================================

    @PostMapping("/tests")
    @ResponseStatus(HttpStatus.CREATED)
    public TestTechniqueDTO creerTest(@Valid @RequestBody CreateTestRequest req) {
        return service.creerTestPourOffre(req);
    }

    @PostMapping("/agent-chat")
    public AgentChatResponse chatAvecAgent(@Valid @RequestBody AgentChatRequest req) {
        return service.chatAvecAgent(req);
    }

    @PutMapping("/tests/{id}")
    public TestTechniqueDTO modifierTest(@PathVariable Long id, @Valid @RequestBody UpdateTestRequest req) {
        return service.modifierTest(id, req);
    }

    @PatchMapping("/tests/{id}/publier")
    public TestTechniqueDTO publierTest(@PathVariable Long id) {
        return service.publierTest(id);
    }

    @GetMapping("/tests/offre/{offreId}")
    public List<TestTechniqueDTO> getTestsPourOffre(@PathVariable Long offreId) {
        return service.getTestsPourOffre(offreId);
    }

    @GetMapping("/tests/entreprise")
    public List<TestTechniqueDTO> getTestsEntreprise() {
        return service.getMesTestsEntreprise();
    }

    @GetMapping("/tests/{id}")
    public TestTechniqueDTO getTestById(@PathVariable Long id) {
        return service.getTestById(id);
    }

    @PostMapping("/tests/passer")
    public PassageTestDTO soumettreTest(@Valid @RequestBody SoumettreTestRequest req) {
        return service.soumettreTest(req);
    }

    @GetMapping("/tests/mes-passages")
    public List<PassageTestDTO> getMesPassagesCandidat() {
        return service.getPassagesCandidat();
    }

    @GetMapping("/tests/passages-entreprise")
    public List<PassageTestDTO> getPassagesPourEntreprise() {
        return service.getPassagesPourEntreprise();
    }

    @GetMapping("/passages/{id}/details")
    public PassageDetailDTO getPassageDetail(@PathVariable Long id) {
        return service.getPassageDetail(id);
    }

    // =========================================================================
    // ÉVALUATION IA (Note sur 20 & Recommandation)
    // =========================================================================

    @PostMapping("/evaluer/{candidatureId}")
    public EvaluationIADTO evaluerCandidature(@PathVariable Long candidatureId) {
        return service.evaluerCandidatureIA(candidatureId);
    }

    @GetMapping("/candidature/{candidatureId}")
    public EvaluationIADTO getEvaluationCandidature(@PathVariable Long candidatureId) {
        return service.getEvaluationPourCandidature(candidatureId);
    }

    @GetMapping("/entreprise")
    public List<EvaluationIADTO> getEvaluationsEntreprise() {
        return service.getEvaluationsEntreprise();
    }

    @PostMapping("/valider/{candidatureId}")
    public EvaluationIADTO validerDecision(
        @PathVariable Long candidatureId,
        @Valid @RequestBody ValiderDecisionRequest req
    ) {
        return service.validerDecisionRecruteur(candidatureId, req);
    }
}

