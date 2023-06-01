import { CircularProgress } from '@mui/material';
import './App.css';
import ImageMapperEditor from './ImageMapperEditor';
import React from 'react';
import ImageUploading from 'react-images-uploading';


function App() {
  const [imageURI, setImageURI] = React.useState();
  const [loading, setLoading] = React.useState(false);

  const onChange = (imageList, addUpdateIndex) => {
    setLoading(true)

    console.log(imageList, addUpdateIndex);

    var data = new FormData()
    data.append("file", imageList[0]["file"])
    const filename = imageList[0]["file"]["name"]

    fetch("http://localhost:8080/add/file", { method: 'POST', body: data })
      .then(response => response.json())
      .then(data => {
        setImageURI("http://localhost:8080/" + data[filename]["uri"]);
        setLoading(false)
        console.log(data[filename]["uri"])
      }
      )
      .catch(e => console.log(e))
  };

  return (
    <div className="App">
      <header className="App-header">
        {imageURI == undefined ?
          <ImageUploading
            onChange={onChange}
            maxNumber={1}
            dataURLKey="data_url"
          >
            {({
              onImageUpload,
              isDragging,
              dragProps,
            }) => (
              // write your building UI
              <div className="upload__image-wrapper">
                <button
                  style={isDragging ? { color: 'red' } : undefined}
                  onClick={onImageUpload}
                  {...dragProps}
                >
                  Click or Drop here
                </button>
              </div>
            )}
          </ImageUploading> :
          <ImageMapperEditor image={imageURI} />
        }
        {loading ? <CircularProgress /> : null}
      </header>
    </div>
  );
}

export default App;
