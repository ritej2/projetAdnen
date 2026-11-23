package com.team.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${talentflow.firebase.credentials-path:}")
    private String credentialsPath;

    @Value("${talentflow.firebase.storage-bucket:}")
    private String storageBucket;

    private boolean firebaseInitialized = false;

    @PostConstruct
    public void initFirebase() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                firebaseInitialized = true;
                return;
            }
            if (credentialsPath != null && !credentialsPath.isBlank()) {
                File f = new File(credentialsPath);
                if (f.exists() && f.isFile()) {
                    try (FileInputStream serviceAccount = new FileInputStream(f)) {
                        FirebaseOptions.Builder builder = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount));
                        if (storageBucket != null && !storageBucket.isBlank()) {
                            builder.setStorageBucket(storageBucket);
                        }
                        FirebaseApp.initializeApp(builder.build());
                        firebaseInitialized = true;
                        log.info("Firebase Admin SDK initialized successfully from {}", credentialsPath);
                        return;
                    }
                }
            }
            log.info("Firebase Admin SDK credentials file not provided. Running in hybrid/dev authentication mode.");
        } catch (Exception e) {
            log.warn("Could not initialize Firebase Admin SDK: {}. Running in fallback auth mode.", e.getMessage());
        }
    }

    public boolean isFirebaseInitialized() {
        return firebaseInitialized && !FirebaseApp.getApps().isEmpty();
    }
}
