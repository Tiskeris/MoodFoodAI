package org.moodmealai.moodmealai;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.cloud.StorageClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTests {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final String validToken = "valid.token.string";
    private final String bearerToken = "Bearer " + validToken;
    private final String invalidToken = "invalid.token.string";
    private final String testUid = "test-uid-123";
    private final String testEmail = "test@example.com";
    private final String testPassword = "password123";

    @Test
    void registerUser_Success() throws Exception {
        UserDto userDto = new UserDto();
        userDto.setEmail(testEmail);
        userDto.setPassword(testPassword);

        when(authService.registerUser(testEmail, testPassword)).thenReturn("User registered successfully");

        String result = String.valueOf(authController.registerUser(userDto));

        assertEquals("User registered successfully", result);
        verify(authService).registerUser(testEmail, testPassword);
    }

    @Test
    void loginUser_ValidToken_ReturnsSuccess() throws FirebaseAuthException {
        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            FirebaseToken decodedToken = mock(FirebaseToken.class);
            when(decodedToken.getUid()).thenReturn(testUid);

            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(mock(FirebaseAuth.class));
            when(FirebaseAuth.getInstance().verifyIdToken(validToken)).thenReturn(decodedToken);

            ResponseEntity<?> response = authController.loginUser(bearerToken);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("User authenticated with UID: " + testUid, response.getBody());
        }
    }

    @Test
    void loginUser_InvalidToken_ReturnsUnauthorized() throws FirebaseAuthException {
        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(mock(FirebaseAuth.class));

            // Create a proper FirebaseAuthException
            FirebaseAuthException authException = mock(FirebaseAuthException.class);
            when(authException.getMessage()).thenReturn("Token is invalid");

            when(FirebaseAuth.getInstance().verifyIdToken(invalidToken))
                    .thenThrow(authException);

            ResponseEntity<?> response = authController.loginUser("Bearer " + invalidToken);

            assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
            assertTrue(response.getBody().toString().contains("Authentication failed"));
        }
    }

    @Test
    void loginUser_MalformedToken_ReturnsUnauthorized() {
        ResponseEntity<?> response = authController.loginUser("MalformedToken");

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Authentication failed"));
    }

    @Test
    void getPhotoUrl_ValidToken_ReturnsUrl() throws Exception {
        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class);
             MockedStatic<StorageClient> mockedStorageClient = mockStatic(StorageClient.class)) {

            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(mock(FirebaseAuth.class));

            when(authService.verifyToken(validToken)).thenReturn(testUid);

            StorageClient storageClient = mock(StorageClient.class);
            com.google.cloud.storage.Bucket bucket = mock(com.google.cloud.storage.Bucket.class);
            mockedStorageClient.when(StorageClient::getInstance).thenReturn(storageClient);
            when(storageClient.bucket()).thenReturn(bucket);
            when(bucket.getName()).thenReturn("test-bucket");

            ResponseEntity<String> response = authController.getPhotoUrl(bearerToken);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().contains("https://firebasestorage.googleapis.com"));
            assertTrue(response.getBody().contains(testUid));
            verify(authService).verifyToken(validToken);
        }
    }
}