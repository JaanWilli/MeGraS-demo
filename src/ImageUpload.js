import { Button, CircularProgress } from '@mui/material';
import './App.css';
import ImageAnnotator from './ImageAnnotator';
import React from 'react';
import ImageUploading from 'react-images-uploading';
import AddIcon from '@mui/icons-material/Add';


const ImageUpload = () => {
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
                setImageURI("http://localhost:8080/" + data[filename]["uri"]);
                setLoading(false)
                console.log(data[filename]["uri"])
            }
            )
            .catch(e => console.log(e))
    };

    return (
        <div className="App-content">
            {imageURI == undefined && !loading &&
                <ImageUploading
                    onChange={onChange}
                    multiple={false}
                    dataURLKey="data_url"
                >
                    {({
                        onImageUpload,
                        onImageRemove,
                        isDragging,
                        dragProps,
                    }) => (
                        <div className="upload__image-wrapper">
                            {image ?
                                <>
                                    <img src={image['data_url']} />
                                    <div className="image-item__btn-wrapper">
                                        <Button onClick={() => onImageRemove()}>Remove</Button>
                                    </div>
                                </> :
                                <Button
                                    style={isDragging ? { color: 'red' } : undefined}
                                    onClick={onImageUpload}
                                    startIcon={<AddIcon />}
                                    {...dragProps}
                                >
                                    Upload Image
                                </Button>
                            }
                        </div>
                    )}
                </ImageUploading>}
            {image && !loading && !imageURI && <Button onClick={confirm}>Confirm</Button>}
            {loading && <CircularProgress />}
            {imageURI && <ImageAnnotator image={imageURI} />}
        </div>
    );
}

export default ImageUpload;
