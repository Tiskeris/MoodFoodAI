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

test('shows error if file size exceeds 5MB', () => {
    render(<MainPage />);

    const file = new File(['a'.repeat(5 * 1024 * 1024 + 1)], 'large-file.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload photo/i);

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

    expect(screen.getByText(/file size exceeds 5mb/i)).toBeInTheDocument();
});

test('shows error if no file is selected', async () => {
    render(<MainPage />);
    fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));
    expect(await screen.findByText(/no file selected/i)).toBeInTheDocument();
});

test('shows error if invalid file type is selected', () => {
    render(<MainPage />);

    const file = new File([''], 'invalid-file.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload photo/i);

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

    expect(screen.getByText(/invalid file type. only jpg and png are allowed/i)).toBeInTheDocument();
});

test('renders upload photo heading and button', () => {
    render(<MainPage />);
    expect(screen.getByRole('heading', { name: /upload photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument();
});

test('renders photo upload input', () => {
    render(<MainPage />);
    const input = screen.getByLabelText(/upload photo/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
});
