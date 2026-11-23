package com.team.backend.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.team.backend.config.FirebaseConfig;
import com.team.backend.entity.RoleUtilisateur;
import com.team.backend.entity.Utilisateur;
import com.team.backend.repository.UtilisateurRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.Optional;

@Component
public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    private final FirebaseConfig firebaseConfig;
    private final UtilisateurRepository utilisateurRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FirebaseAuthenticationFilter(FirebaseConfig firebaseConfig, UtilisateurRepository utilisateurRepository) {
        this.firebaseConfig = firebaseConfig;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (!token.isEmpty()) {
                try {
                    TokenClaims claims = verifyOrExtractClaims(token);
                    if (claims != null && claims.uid != null) {
                        Optional<Utilisateur> optUser = utilisateurRepository.findByFirebaseUid(claims.uid);
                        if (optUser.isEmpty() && claims.email != null) {
                            optUser = utilisateurRepository.findByEmail(claims.email);
                        }

                        if (optUser.isPresent()) {
                            Utilisateur u = optUser.get();
                            if (!u.isActif()) {
                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                response.setContentType("application/json");
                                response.getWriter().write("{\"message\":\"Ce compte a été désactivé par un administrateur.\"}");
                                return;
                            }
                            AuthenticatedUser principal = new AuthenticatedUser(
                                u.getFirebaseUid(),
                                u.getEmail(),
                                u.getNom(),
                                u.getId(),
                                u.getRole(),
                                u.isActif()
                            );
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()))
                            );
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        } else {
                            // Authenticated in Firebase, about to sync with PostgreSQL (/api/users/sync)
                            AuthenticatedUser principal = new AuthenticatedUser(
                                claims.uid,
                                claims.email,
                                claims.name != null ? claims.name : "Utilisateur",
                                null,
                                RoleUtilisateur.CANDIDAT,
                                true
                            );
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_CANDIDAT"))
                            );
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                } catch (Exception ignored) {
                    // Invalid token leaves SecurityContext unauthenticated
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private TokenClaims verifyOrExtractClaims(String token) throws Exception {
        // 1. If Firebase Admin SDK is configured with a service account, verify cryptographically
        if (firebaseConfig.isFirebaseInitialized() && !token.startsWith("dev-token:")) {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            return new TokenClaims(decodedToken.getUid(), decodedToken.getEmail(), decodedToken.getName());
        }

        // 2. Support explicit dev/demo tokens: "dev-token:<firebaseUid>:<email>:<name>"
        if (token.startsWith("dev-token:")) {
            String[] parts = token.split(":", 4);
            String uid = parts.length > 1 ? parts[1] : null;
            String email = parts.length > 2 ? parts[2] : null;
            String name = parts.length > 3 ? parts[3] : "Utilisateur";
            return new TokenClaims(uid, email, name);
        }

        // 3. Support standard Firebase client JWT payload extraction when running locally without service-account.json
        String[] jwtParts = token.split("\\.");
        if (jwtParts.length == 3) {
            byte[] decodedBytes = Base64.getUrlDecoder().decode(jwtParts[1]);
            String payloadJson = new String(decodedBytes, StandardCharsets.UTF_8);
            JsonNode node = objectMapper.readTree(payloadJson);
            String uid = node.hasNonNull("user_id") ? node.get("user_id").asText()
                : (node.hasNonNull("sub") ? node.get("sub").asText() : null);
            String email = node.hasNonNull("email") ? node.get("email").asText() : null;
            String name = node.hasNonNull("name") ? node.get("name").asText() : email;
            if (uid != null) {
                return new TokenClaims(uid, email, name);
            }
        }
        return null;
    }

    private record TokenClaims(String uid, String email, String name) {}
}
