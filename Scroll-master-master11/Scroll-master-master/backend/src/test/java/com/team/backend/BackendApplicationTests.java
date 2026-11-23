package com.team.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.backend.dto.CandidatureDTO;
import com.team.backend.dto.OffreDTO;
import com.team.backend.entity.StatutCandidature;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class BackendApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String CANDIDAT_TOKEN = "Bearer dev-token:uid-candidat-1:marie.dubois@talentflow.io:Marie Dubois";
    private static final String ENTREPRISE_TOKEN = "Bearer dev-token:uid-entreprise-1:recrutement@novastudio.io:Sophie Mercier";
    private static final String ADMIN_TOKEN = "Bearer dev-token:uid-admin-1:admin@talentflow.io:Alexandre Moreau";

    @Test
    void shouldListPublicJobOffersAndFilter() throws Exception {
        mockMvc.perform(get("/api/offres")
                .param("keyword", "Java")
                .param("typeContrat", "CDI"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].titre").exists());
    }

    @Test
    void shouldReturnAuthenticatedCandidateProfile() throws Exception {
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", CANDIDAT_TOKEN))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.user.email").value("marie.dubois@talentflow.io"))
            .andExpect(jsonPath("$.user.role").value("CANDIDAT"))
            .andExpect(jsonPath("$.candidat.competences").exists());
    }

    @Test
    void shouldPreventDuplicateApplicationAndAllowNewApplication() throws Exception {
        // Offer 1 already applied by Candidat 1 in DataSeeder -> should return 409 CONFLICT
        CandidatureDTO.CreateRequest duplicateReq = new CandidatureDTO.CreateRequest(1L, "Test doublon", null);
        mockMvc.perform(post("/api/candidatures")
                .header("Authorization", CANDIDAT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateReq)))
            .andExpect(status().isConflict());

        // Offer 3 not yet applied by Candidat 1 -> should return 201 CREATED
        CandidatureDTO.CreateRequest validReq = new CandidatureDTO.CreateRequest(3L, "Très motivée par Lumen AI", null);
        mockMvc.perform(post("/api/candidatures")
                .header("Authorization", CANDIDAT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("EN_ATTENTE"));
    }

    @Test
    void shouldEnforceRoleBasedAccessControlForCompanyAndAdmin() throws Exception {
        // Candidate cannot access Admin endpoints -> 403 FORBIDDEN
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", CANDIDAT_TOKEN))
            .andExpect(status().isForbidden());

        // Admin can access Admin endpoints -> 200 OK
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", ADMIN_TOKEN))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());

        // Company can create a new job offer -> 201 CREATED
        OffreDTO.SaveRequest newOffer = new OffreDTO.SaveRequest(
            "Cloud Platform Engineer (AWS / Kubernetes)",
            "Concevez et opérez notre infrastructure multi-régions.",
            "Automatisation Terraform et observabilité.",
            "3+ ans sur AWS et Kubernetes.",
            "Paris, France",
            "Hybride",
            "Ingénierie & Tech",
            "CDI",
            "Confirmé",
            "AWS, Kubernetes, Terraform, Docker",
            new BigDecimal("60000"),
            new BigDecimal("72000"),
            null,
            null
        );
        mockMvc.perform(post("/api/offres")
                .header("Authorization", ENTREPRISE_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newOffer)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.titre").value("Cloud Platform Engineer (AWS / Kubernetes)"));

        // Company can update application status on its own offer -> 200 OK
        CandidatureDTO.UpdateStatutRequest statusReq = new CandidatureDTO.UpdateStatutRequest(
            StatutCandidature.ACCEPTEE,
            "Proposition validée suite au test technique."
        );
        mockMvc.perform(patch("/api/candidatures/1/statut")
                .header("Authorization", ENTREPRISE_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("ACCEPTEE"));
    }
}
