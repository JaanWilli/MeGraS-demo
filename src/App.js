import { Routes, Route, Link } from 'react-router-dom';
import React from 'react';
import './App.css';
import Library from './Library';
import ImageUpload from './FileUpload'
import { Box, Button, CssBaseline, ThemeProvider, Snackbar, Alert } from '@mui/material';
import CocoImporter from './CocoImporter';
import { theme } from './ThemeOptions';
import MediaDetails from './MediaDetails';

import HomeIcon from '@mui/icons-material/Home';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SearchIcon from '@mui/icons-material/Search';
import Query from './Query';
import MediaAnnotator from './MediaAnnotator';

const App = () => {

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState();
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("info");

  const triggerSnackbar = (message, severity) => {
    setSnackbarOpen(true)
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="App">
        <div className="App-header">
          <Link to="/"><Button variant='contained'><HomeIcon /></Button></Link>
          <Link to="/add"><Button variant='contained'><FileUploadIcon /></Button></Link>
          <Link to="/coco"><Button variant='contained'><CloudDownloadIcon /></Button></Link>
          <Link to="/query"><Button variant='contained'><SearchIcon /></Button></Link>
        </div>
        <Routes>
          <Route path="/" element={<Library triggerSnackbar={triggerSnackbar} />} />
          <Route path="/add" element={<ImageUpload triggerSnackbar={triggerSnackbar} />} />
          <Route path="/:objectId" element={<MediaDetails triggerSnackbar={triggerSnackbar} />} />
          <Route path="/segment/:id" element={<MediaAnnotator triggerSnackbar={triggerSnackbar} />} />
          <Route path="/coco" element={<CocoImporter triggerSnackbar={triggerSnackbar} />} />
          <Route path="/query" element={<Query triggerSnackbar={triggerSnackbar} />} />
        </Routes>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={8000}
          onClose={handleClose}
          anchorOrigin={{vertical: "bottom", horizontal: "right"}}
        >
          <Alert severity={snackbarSeverity} onClose={handleClose} sx={{width: '100%', fontSize: '22px'}} >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
