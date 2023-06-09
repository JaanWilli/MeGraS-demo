import { Routes, Route, Link } from 'react-router-dom';
import React from 'react';
import './App.css';
import Library from './Library';
import ImageUpload from './FileUpload'
import { Box, Button, CssBaseline, ThemeProvider } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ImageAnnotator from './ImageAnnotator';
import CocoImporter from './CocoImporter';
import { theme } from './ThemeOptions';
import MediaDetails from './MediaDetails';


const App = () => {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="App">
        <div className="App-header">
          <Link to="/"><Button variant='contained'><HomeIcon /></Button></Link>
          <Link to="/add"><Button variant='contained'><FileUploadIcon /></Button></Link>
          <Link to="/coco"><Button variant='contained'><CloudDownloadIcon /></Button></Link>
        </div>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/add" element={<ImageUpload />} />
          <Route path="/:objectId" element={<MediaDetails />} />
          <Route path="/segment/:imageId" element={<ImageAnnotator />} />
          <Route path="/coco" element={<CocoImporter />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}

export default App;
