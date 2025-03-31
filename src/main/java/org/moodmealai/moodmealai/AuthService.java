package org.moodmealai.moodmealai;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public String registerUser(String email, String password) throws Exception {
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setEmail(email)
                .setPassword(password);

        UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
        return userRecord.getUid();
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