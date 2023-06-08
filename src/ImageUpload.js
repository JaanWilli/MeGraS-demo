import { Box, Button, CircularProgress, Grid, Stack } from '@mui/material';
import './App.css';
import React from 'react';
import ImageUploading from 'react-images-uploading';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router';


const ImageUpload = () => {
    const navigate = useNavigate();

    const [image, setImage] = React.useState();
    const [imageURI, setImageURI] = React.useState();
    const [loading, setLoading] = React.useState(false);

    const onChange = (imageList, addUpdateIndex) => {
        setImage(imageList[0]);
    };

    const confirm = () => {
        setLoading(true)

        var data = new FormData()
        data.append("file", image["file"])
        const filename = image["file"]["name"]

        fetch("http://localhost:8080/add/file", { method: 'POST', body: data })
            .then(response => response.json())
            .then(data => {
                setLoading(false)
                console.log(data[filename]["uri"])
                navigate("/segment/" + data[filename]["uri"]);
            }
            )
            .catch(e => console.log(e))
    };

    return (
        <>
            <div className='App-title'>
                Image Upload
                <div className='App-subtitle'>Add a new media document to the library.</div>
            </div>
            <div className="App-content">
                {imageURI == undefined && !loading &&
                    <ImageUploading
                        onChange={onChange}
                        multiple={false}
                        dataURLKey="data_url"
                    >
                        {({
                            onImageUpload,
                            onImageUpdate,
                            isDragging,
                            dragProps,
                        }) => (
                            <div className="upload__image-wrapper">
                                {image ?
                                    <img style={{ cursor: 'pointer' }} src={image['data_url']} onClick={() => onImageUpdate()} />
                                    :
                                    <Box>
                                        <Button
                                            variant='contained'
                                            onClick={onImageUpload}
                                            startIcon={<AddIcon />}
                                            sx={{ m: 1 }}
                                        >
                                            Upload
                                        </Button>
                                        <Box sx={{ m: 1 }}>or</Box>
                                        <Box
                                            width='20vw'
                                            sx={{ m: 2, p: 5, border: '2px dashed grey', borderRadius: '10px', color: isDragging ? '#1565C0' : 'white' }}
                                            {...dragProps}
                                        >Drop file here</Box>

                                    </Box>
                                }
                            </div>
                        )}
                    </ImageUploading>}
                {image && !loading && !imageURI && <Button variant='contained' style={{ color: 'white', marginTop: 8 }} onClick={confirm}>Confirm</Button>}
                {loading && <CircularProgress />}
            </div>
        </>
    );
}

export default ImageUpload;
