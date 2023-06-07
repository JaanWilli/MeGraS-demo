import { Routes, Route, Link } from 'react-router-dom';
import React from 'react';
import './App.css';
import Library from './Library';
import ImageUpload from './ImageUpload'
import { Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';


const App = () => {

  return (
    <div class="App">
      <div class="App-header">
        <Button sx={{margin: '20px'}} variant='contained'><Link to="/"><HomeIcon /></Link></Button>
        <Button sx={{margin: '20px'}} variant='contained'><Link to="/add"><AddPhotoAlternateIcon /></Link></Button>
      </div>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/add" element={<ImageUpload />} />
      </Routes>
    </div>
  );
}

export default App;
