package org.moodmealai.moodmealai;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public String registerUser(String email, String password) throws Exception {
        try {
            UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword(password);

            UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
            return userRecord.getUid();
        } catch (FirebaseAuthException e) {
            System.err.println("Firebase Auth Error: " + e.getErrorCode() + " - " + e.getMessage());

            if (e.getErrorCode().equals("email-already-exists")) {
                throw new Exception("Email already in use");
            } else {
                throw new Exception("Registration failed: " + e.getMessage());
            }
        }
    }

    public String verifyToken(String idToken) {
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            return decodedToken.getUid();
        } catch (FirebaseAuthException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to verify Firebase token: " + e.getMessage());
        }
    }
}