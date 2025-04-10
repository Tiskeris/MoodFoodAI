package org.moodmealai.moodmealai;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.cloud.StorageClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserDto userDto) {
        try {
            String uid = authService.registerUser(userDto.getEmail(), userDto.getPassword());
            return ResponseEntity.ok(Map.of("uid", uid, "success", true));
        } catch (Exception e) {
            e.printStackTrace(); // Log the error
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage(), "success", false));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestHeader("Authorization") String idToken) {
        try {
            idToken = idToken.replace("Bearer ", "");

            // Verify ID Token using Firebase Admin SDK
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();

            return ResponseEntity.ok("User authenticated with UID: " + uid);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Authentication failed: " + e.getMessage());
        }
    }

    @GetMapping("/photo-url")
    public ResponseEntity<String> getPhotoUrl(@RequestHeader("Authorization") String idToken) {
        try {
            idToken = idToken.replace("Bearer ", "");
            String uid = authService.verifyToken(idToken);

            String bucketName = StorageClient.getInstance().bucket().getName();
            String objectName = "users/" + uid + "/profile.jpg";

            // Check if the file exists first
            if (!StorageClient.getInstance().bucket().get(objectName).exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No profile photo found");
            }

            String downloadUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName + "/o/"
                    + URLEncoder.encode(objectName, StandardCharsets.UTF_8.toString())
                    + "?alt=media";

            // Add a timestamp to prevent caching
            downloadUrl += "&t=" + System.currentTimeMillis();

            return ResponseEntity.ok(downloadUrl);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve photo URL: " + e.getMessage());
        }
    }
}