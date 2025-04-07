import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import MainPage from '../MainPage';

global.fetch = jest.fn();

afterEach(() => {
    global.fetch.mockReset();
});

test('should handle error when no photo found for user', async () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 404,
        text: () => Promise.resolve('No profile photo found')
    }));

    render(
        <BrowserRouter>
            <MainPage />
        </BrowserRouter>
    );

    await waitFor(() => {
        expect(screen.queryByAltText('Uploaded')).not.toBeInTheDocument();
    });
});