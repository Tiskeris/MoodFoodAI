import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { auth } from '../firebase'; // Adjust the import path as needed
import Login from '../Login'; // Your Login component
import { MemoryRouter } from 'react-router'; // Import MemoryRouter

// Mock Firebase auth methods
jest.mock('../firebase', () => ({
    auth: {
        signInWithEmailAndPassword: jest.fn(),
        signOut: jest.fn(),
        onAuthStateChanged: jest.fn(),
        currentUser: {
            getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
        },
    },
    storage: {}, // Add if needed
}));

// Mock the fetch calls
global.fetch = jest.fn();

describe('Login and Registration Integration Test', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Mock successful login
        auth.signInWithEmailAndPassword.mockResolvedValue({
            user: {
                uid: 'test-uid',
                email: 'vakaris.info@gmail.com',
                getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
            },
        });

        // Mock auth state change
        auth.onAuthStateChanged.mockImplementation((callback) => {
            callback({
                uid: 'test-uid',
                email: 'vakaris.info@gmail.com',
                getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
            });
            return jest.fn(); // unsubscribe function
        });

        // Mock successful photo URL fetch
        fetch.mockImplementation((url, options) => {
            if (url === 'http://localhost:8080/auth/photo-url') {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    text: () => Promise.resolve('https://example.com/photo.jpg'),
                });
            }
            return Promise.reject(new Error('Unexpected URL'));
        });
    });

    it('should login with email/password and display profile image', async () => {
        render(
            <MemoryRouter>  {/* Wrap your Login component with MemoryRouter */}
                <Login />
            </MemoryRouter>
        );

        // Get input elements
        const emailInput = screen.getByPlaceholderText(/email/i); // Use getByPlaceholderText for email
        const passwordInput = screen.getByPlaceholderText(/password/i); // Use getByPlaceholderText for password
        const loginButton = screen.getByRole('button', { name: /login/i }); // Use getByRole for button

        // Simulate typing and clicking the login button
        await userEvent.type(emailInput, 'vakaris.info@gmail.com');
        await userEvent.type(passwordInput, '123456');
        await userEvent.click(loginButton);

        // Debugging step: Check if the loginButton click was registered
        console.log("Login button clicked");

        // Check if Firebase sign-in function was called
        await waitFor(() => {
            expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
                'vakaris.info@gmail.com',
                '123456'
            );
        });

        // Debugging step: Check how many times the signIn function was called
        console.log(auth.signInWithEmailAndPassword.mock.calls);

        await waitFor(() => {
            expect(window.location.pathname).toBe('/main');
        });

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:8080/auth/photo-url',
            expect.objectContaining({
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mock-id-token',
                },
                cache: 'no-store',
            })
        );

        // Verify profile image is displayed
        const profileImage = await screen.findByRole('img');
        expect(profileImage).toBeInTheDocument();
        expect(profileImage).toHaveAttribute('src', expect.stringContaining('https://example.com/photo.jpg'));
    });
});
