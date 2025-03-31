package org.moodmealai.moodmealai;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.MockedStatic;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class AuthServiceTests {

    @Mock
    private FirebaseAuth firebaseAuth;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private AuthService authService;

    private final String validToken = "valid.token.string";
    private final String invalidToken = "invalid.token.string";
    private final String expectedUid = "test-uid-123";

    @Test
    void verifyToken_WithValidToken_ReturnsUid() throws FirebaseAuthException {
        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(firebaseAuth);

            when(firebaseAuth.verifyIdToken(validToken)).thenReturn(firebaseToken);
            when(firebaseToken.getUid()).thenReturn(expectedUid);

            String actualUid = authService.verifyToken(validToken);

            assertEquals(expectedUid, actualUid);
            verify(firebaseAuth).verifyIdToken(validToken);
        }
    }

    @Test
    void verifyToken_WithInvalidToken_ThrowsRuntimeException() throws FirebaseAuthException {
        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(firebaseAuth);

            FirebaseAuthException authException = mock(FirebaseAuthException.class);
            when(firebaseAuth.verifyIdToken(invalidToken)).thenThrow(authException);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> authService.verifyToken(invalidToken));

            assertEquals("Failed to verify Firebase token: " + authException.getMessage(),
                    exception.getMessage());
            verify(firebaseAuth).verifyIdToken(invalidToken);
        }
    }


}