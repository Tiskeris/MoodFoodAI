import { fireEvent, render, screen } from '@testing-library/react';
import MainPage from '../MainPage';
import App from '../App';

test('renders Login component on default route', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /login\/register/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});
