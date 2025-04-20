import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import App from '../App';
import { useNavigate } from 'react-router';

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
}));


describe('Login/Register Form', () => {
    const mockNavigate = jest.fn();
    beforeEach(() => {
        render(<App />);
    });

    test('renders email and password inputs and buttons', () => {
        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const registerButton = screen.getByRole('button', { name: /register/i });
        const loginButton = screen.getByRole('button', { name: /login/i });

        expect(emailInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
        expect(registerButton).toBeInTheDocument();
        expect(loginButton).toBeInTheDocument();
    });

    test('shows error for invalid email format on register', () => {
        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const registerButton = screen.getByRole('button', { name: /register/i });

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.change(passwordInput, { target: { value: 'Strong1!' } });
        fireEvent.click(registerButton);

        // Tikriname ar įsijungė Toast komponentas (rodomas klaidos pranešimas)
        const toast = screen.getByRole('alert');
        expect(toast).toBeInTheDocument();
    });

    test('shows error for weak password on register', () => {
        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const registerButton = screen.getByRole('button', { name: /register/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'weak' } });
        fireEvent.click(registerButton);

        const toast = screen.getByRole('alert');
        expect(toast).toBeInTheDocument();
    });

    test('shows error for empty fields on login', () => {
        const loginButton = screen.getByRole('button', { name: /login/i });

        fireEvent.click(loginButton);
        const toast = screen.getByRole('alert');
        expect(toast).toBeInTheDocument();
    });

    test('rejects invalid email and strong password on register', () => {
        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const registerButton = screen.getByRole('button', { name: /register/i });

        fireEvent.change(emailInput, { target: { value: 'test' } });
        fireEvent.change(passwordInput, { target: { value: 'test' } });
        fireEvent.click(registerButton);

        const toast = screen.getByRole('alert');
        expect(toast).toBeInTheDocument();
    });

    test('užregistravus vartotoją, patikrinama, ar grąžinamas 200 statusas', async () => {
        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const registerButton = screen.getByRole('button', { name: /register/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'Strong1!' } });

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true, // Tai nurodo, kad request sėkmingas
                status: 200, // Tikriname, ar statusas 200
                text: () => Promise.resolve('fake-uid'), // Atsakymo turinys
            })
        );

        fireEvent.click(registerButton);

        // Tikriname, kad 'fetch' buvo iškviestas ir grąžino 200 statusą
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/auth/register', expect.any(Object));
            expect(global.fetch).toHaveReturned();
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });
});
