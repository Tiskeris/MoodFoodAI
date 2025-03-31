package org.moodmealai.moodmealai;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringBootTest
class MoodMealAiApplicationTests {

    private FirebaseAuth mockAuth;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        mockAuth = mock(FirebaseAuth.class);
        authService = new AuthService();
    }

    @Test
    void testRegisterUser() throws Exception {
        FirebaseAuth mockAuth = mock(FirebaseAuth.class);
        AuthService authService = new AuthService();

        UserRecord mockUserRecord = mock(UserRecord.class);
        when(mockUserRecord.getUid()).thenReturn("test-uid");

        when(mockAuth.createUser(any())).thenReturn(mockUserRecord);

        String uid = authService.registerUser("vakaris.info@example.com", "123456");
        assertNotNull(uid);
        assertNotNull(uid);
        assertFalse(uid.isEmpty());
    }
}
