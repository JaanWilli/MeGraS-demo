import { Routes, Route, Link } from 'react-router-dom';
import React from 'react';
import './App.css';
import Library from './Library';
import ImageUpload from './ImageUpload'
import { Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ImageAnnotator from './ImageAnnotator';
import CocoImporter from './CocoImporter';


const App = () => {

  return (
    <div className="App">
      <div className="App-header">
        <Link to="/"><Button variant='contained'><HomeIcon /></Button></Link>
        <Link to="/add"><Button variant='contained'><AddPhotoAlternateIcon /></Button></Link>
        <Link to="/coco"><Button variant='contained'><CloudDownloadIcon /></Button></Link>
      </div>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/add" element={<ImageUpload />} />
        <Route path="/segment/:imageId" element={<ImageAnnotator />} />
        <Route path="/coco" element={<CocoImporter />} />
      </Routes>
    </div>
  );
}

export default App;
