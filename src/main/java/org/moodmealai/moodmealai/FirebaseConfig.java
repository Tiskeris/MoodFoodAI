package org.moodmealai.moodmealai;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        FirebaseOptions options;

        String credentialsJson = System.getenv("ACCOUNT_KEY_JSON");
        if (credentialsJson != null && !credentialsJson.isEmpty()) {
            options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(
                            new ByteArrayInputStream(credentialsJson.getBytes())))
                    .setStorageBucket("moodfoodai-fee4f.firebasestorage.app")
                    .build();
        } else {
            // For local development
            FileInputStream serviceAccount = new FileInputStream("src/main/resources/AccountKey.json");
            options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setStorageBucket("moodfoodai-fee4f.firebasestorage.app")
                    .build();
        }

        return FirebaseApp.initializeApp(options);
    }
}