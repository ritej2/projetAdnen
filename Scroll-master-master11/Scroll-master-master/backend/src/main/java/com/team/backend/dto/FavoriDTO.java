package com.team.backend.dto;

import java.time.LocalDateTime;

public record FavoriDTO(
    Long id,
    Long candidatId,
    LocalDateTime dateAjout,
    OffreDTO offre
) {}
