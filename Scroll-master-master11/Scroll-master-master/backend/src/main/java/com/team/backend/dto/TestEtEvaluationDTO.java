package com.team.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TestEtEvaluationDTO {

    public record QuestionDTO(
        int id,
        String question,
        List<String> options,
        int bonneReponse,
        String explication
    ) {}

    public record TestTechniqueDTO(
        Long id,
        Long offreId,
        String offreTitre,
        String nomEntreprise,
        String titre,
        String description,
        Integer dureeMinutes,
        Integer scoreMinimum,
        List<QuestionDTO> questions,
        boolean genereParIa,
        boolean publie,
        String statut,
        LocalDateTime dateCreation,
        Long nombrePassages
    ) {}

    public record CreateTestRequest(
        Long offreId,
        String titre,
        String description,
        Integer dureeMinutes,
        Integer scoreMinimum,
        String competencesCibles,
        List<QuestionDTO> questionsCustom,
        Boolean publie,
        String statut
    ) {}

    public record UpdateTestRequest(
        String titre,
        String description,
        Integer dureeMinutes,
        Integer scoreMinimum,
        List<QuestionDTO> questions,
        Boolean publie,
        String statut
    ) {}

    public record AgentChatRequest(
        Long offreId,
        String message,
        List<QuestionDTO> questionsActuelles,
        Integer dureeMinutes,
        Integer scoreMinimum,
        String titreTest
    ) {}

    public record AgentChatResponse(
        String messageAgent,
        String titreTest,
        String description,
        Integer dureeMinutes,
        Integer scoreMinimum,
        List<QuestionDTO> questions,
        boolean validePourPublication
    ) {}

    public record DetailReponseQuestion(
        int index,
        String question,
        List<String> options,
        int choixCandidat,
        int bonneReponse,
        boolean estCorrect,
        String explication
    ) {}

    public record PassageDetailDTO(
        Long passageId,
        Long testId,
        String testTitre,
        Long candidatureId,
        String candidatNom,
        String candidatEmail,
        Integer score,
        Integer bonnesReponses,
        Integer totalQuestions,
        boolean reussi,
        LocalDateTime datePassage,
        List<DetailReponseQuestion> details
    ) {}

    public record PassageTestDTO(
        Long id,
        Long testId,
        String testTitre,
        Long candidatureId,
        Long candidatId,
        String candidatNom,
        String candidatEmail,
        Long offreId,
        String offreTitre,
        Integer bonnesReponses,
        Integer totalQuestions,
        Integer score,
        boolean reussi,
        LocalDateTime datePassage
    ) {}

    public record SoumettreTestRequest(
        Long testId,
        Long candidatureId,
        List<Integer> reponsesChoisies
    ) {}

    public record EvaluationIADTO(
        Long id,
        Long candidatureId,
        Long candidatId,
        String candidatNom,
        String candidatEmail,
        String candidatTitre,
        String cvUrl,
        Long offreId,
        String offreTitre,
        String nomEntreprise,
        Double noteSur20,
        Integer scoreGlobal,
        Integer scoreCompetences,
        Integer scoreExperience,
        Integer scoreFormation,
        Integer scoreMotivation,
        Integer scoreProfil,
        Integer scoreTest,
        String recommandation,
        Integer niveauConfiance,
        List<String> competencesTrouvees,
        List<String> competencesManquantes,
        List<String> pointsForts,
        List<String> pointsAmelioration,
        String synthese,
        String decisionRecruteur,
        String commentaireRecruteur,
        LocalDateTime dateValidation,
        LocalDateTime dateEvaluation
    ) {}

    public record ValiderDecisionRequest(
        String decision, // ACCEPTEE, ENTRETIEN, REFUSEE
        String commentaire
    ) {}
}

