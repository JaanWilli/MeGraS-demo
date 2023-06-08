import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#444d4e',
            contrastText: '#e0e0e0',
        },
        secondary: {
            main: '#37d2c6',
        },
        background: {
            default: '#f5f5f5',
        },
    },
});
