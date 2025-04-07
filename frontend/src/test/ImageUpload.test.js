import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import MainPage from '../MainPage';
import '@testing-library/jest-dom';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, storage } from '../firebase';
import { toast } from 'react-toastify';


jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => jest.fn()
}));

jest.mock('../firebase', () => {
    const unsubscribeMock = jest.fn();

    return {
        auth: {
            onAuthStateChanged: jest.fn((callback) => {
                callback({
                    uid: 'test-user',
                    getIdToken: jest.fn().mockResolvedValue('test-token')
                });
                return unsubscribeMock;
            }),
            currentUser: { uid: 'test-user' },
            signOut: jest.fn().mockResolvedValue(undefined)
        },
        storage: {}
    };
});

jest.mock('firebase/storage', () => ({
    ref: jest.fn().mockReturnValue({}),
    uploadBytes: jest.fn().mockResolvedValue({}),
    getDownloadURL: jest.fn().mockResolvedValue('https://example.com/photo.jpg'),
    deleteObject: jest.fn().mockResolvedValue({})
}));

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn()
    },
    ToastContainer: () => <div data-testid="toast-container" />
}));

global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('https://example.com/photo.jpg')
    })
);

const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('MainPage handleUpload Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn();
        console.log = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
    });

    test('logs error when no file is selected', async () => {
        render(<MainPage />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        expect(console.error).toHaveBeenCalledWith('No file selected');
        expect(toast.error).toHaveBeenCalledWith('No file selected');
        expect(uploadBytes).not.toHaveBeenCalled();
    });

    //BTS-35
    test('logs error when file size exceeds 5MB', async () => {
        render(<MainPage />, { wrapper: MemoryRouter });

        const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
        const input = screen.getByLabelText(/upload photo/i);

        fireEvent.change(input, { target: { files: [largeFile] } });
        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        expect(console.error).toHaveBeenCalledWith('File size exceeds 5MB');
        expect(toast.error).toHaveBeenCalledWith('File exceeds 5MB');
        expect(uploadBytes).not.toHaveBeenCalled();
    });

    test('logs error when file type is invalid', async () => {
        render(<MainPage />, { wrapper: MemoryRouter });

        const invalidFile = new File(['test content'], 'file.txt', { type: 'text/plain' });
        const input = screen.getByLabelText(/upload photo/i);

        fireEvent.change(input, { target: { files: [invalidFile] } });
        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        expect(toast.error).toHaveBeenCalledWith('File type not allowed');
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
        expect(uploadBytes).not.toHaveBeenCalled();
    });

    //BTS-37
    test('uploads valid JPG file successfully', async () => {
        render(<MainPage />, { wrapper: MemoryRouter });

        const validFile = new File(['valid image content'], 'photo.jpg', { type: 'image/jpeg' });
        const input = screen.getByLabelText(/upload photo/i);

        fireEvent.change(input, { target: { files: [validFile] } });
        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        await waitFor(() => {
            expect(ref).toHaveBeenCalledWith(storage, 'users/test-user/profile.jpg');
            expect(uploadBytes).toHaveBeenCalled();
            expect(getDownloadURL).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('File uploaded successfully. URL:', undefined);
            expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!');
        });
    });

    //BTS-37
    test('uploads valid PNG file successfully', async () => {
        render(<MainPage />, { wrapper: MemoryRouter });

        const validFile = new File(['valid image content'], 'photo.png', { type: 'image/png' });
        const input = screen.getByLabelText(/upload photo/i);

        fireEvent.change(input, { target: { files: [validFile] } });
        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        await waitFor(() => {
            expect(uploadBytes).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!');
        });
    });

    test('handles error when user is not authenticated', async () => {
        const originalCurrentUser = auth.currentUser;
        auth.currentUser = null;

        render(<MainPage />, { wrapper: MemoryRouter });

        const validFile = new File(['valid image content'], 'photo.jpg', { type: 'image/jpeg' });
        const input = screen.getByLabelText(/upload photo/i);

        fireEvent.change(input, { target: { files: [validFile] } });
        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('File upload failed: User not authenticated');
            expect(toast.error).toHaveBeenCalledWith('File upload failed: User not authenticated');
        });

        // Restore original mock
        auth.currentUser = originalCurrentUser;
    });

    //BTS-36
    test('handles upload failure', async () => {
        uploadBytes.mockRejectedValueOnce(new Error('Upload failed'));

        render(<MainPage />, { wrapper: MemoryRouter });

        const validFile = new File(['valid image content'], 'photo.jpg', { type: 'image/jpeg' });
        const input = screen.getByLabelText(/upload photo/i);

        fireEvent.change(input, { target: { files: [validFile] } });
        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('File upload failed: Upload failed');
            expect(toast.error).toHaveBeenCalledWith('File upload failed: Upload failed');
        });
    });

    test('attempts to delete existing file before upload', async () => {
        render(<MainPage />, { wrapper: MemoryRouter });

        const validFile = new File(['valid image content'], 'photo.jpg', { type: 'image/jpeg' });
        const input = screen.getByLabelText(/upload photo/i);

        fireEvent.change(input, { target: { files: [validFile] } });
        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        await waitFor(() => {
            expect(deleteObject).toHaveBeenCalled();
        });
    });

    test('handles error when deleting existing file', async () => {
        deleteObject.mockRejectedValueOnce(new Error('File not found'));

        render(<MainPage />, { wrapper: MemoryRouter });

        const validFile = new File(['valid image content'], 'photo.jpg', { type: 'image/jpeg' });
        const input = screen.getByLabelText(/upload photo/i);

        fireEvent.change(input, { target: { files: [validFile] } });
        fireEvent.click(screen.getByRole('button', { name: /upload photo/i }));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('No existing file to delete');
            expect(uploadBytes).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!');
        });
    });
});