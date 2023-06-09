import { Box, Button, CircularProgress, Grid, IconButton, Stack } from '@mui/material';
import './App.css';
import React from 'react';
import { useNavigate } from 'react-router';
import { useDropzone } from 'react-dropzone'
import AddIcon from '@mui/icons-material/Add';
import FileDisplay from './FileDisplay';



const ImageUpload = () => {
    const navigate = useNavigate();

    const [file, setFile] = React.useState();
    const [filedata, setFiledata] = React.useState();
    const [filetype, setFiletype] = React.useState();
    const [fileID, setFileID] = React.useState();
    const [loading, setLoading] = React.useState(false);


    const onDrop = React.useCallback(files => {
        handleFileUpload(files[0])
    }, [])
    const { getRootProps } = useDropzone({ onDrop })

    const onFileSelect = (e) => {
        if (!e.target.files) {
            return;
        }
        handleFileUpload(e.target.files[0])
    }

    const handleFileUpload = (file) => {
        console.log(file)
        setFile(file)
        setFiledata(URL.createObjectURL(file))
        setFiletype(file.type)
    };

    

    const cancel = () => {
        setFile()
        setFiledata()
        setFiletype()
        setFileID()
    }

    const confirm = () => {
        setLoading(true)

        var data = new FormData()
        data.append("file", file)
        const filename = file["name"]

        fetch("http://localhost:8080/add/file", { method: 'POST', body: data })
            .then(response => response.json())
            .then(data => {
                setLoading(false)
                console.log(data[filename]["uri"])
                setFileID(data[filename]["uri"])
            }
            )
            .catch(e => console.log(e))
    };

    return (
        <>
            <div className='App-title'>
                File Upload
                <div className='App-subtitle'>Add a new media document to the library.</div>
            </div>
            <div className="App-content">
                {!file &&
                    <>
                        <Button
                            component="label"
                            variant='contained'
                            startIcon={<AddIcon />}
                            sx={{ m: 1 }}
                        >
                            Select from computer
                            <input type="file" hidden onChange={onFileSelect} />
                        </Button>
                        <Box sx={{ m: 1 }}>or</Box>
                        <Box
                            m={2}
                            p={5}
                            width='20vw'
                            sx={{ border: '2px dashed #444d4e', borderRadius: '10px' }}
                            {...getRootProps()}
                        >Drop file here</Box>
                    </>
                }
                {file && !loading && !fileID &&
                    <Stack spacing={2} direction="column" alignItems="center">
                        <Box>{file.name}</Box>
                        <FileDisplay filetype={filetype} filedata={filedata} filename={file.name} />
                        <Stack spacing={2} mt={2} direction="row">
                            <Button variant='contained' onClick={cancel}>Cancel</Button>
                            <Button variant='contained' color='secondary' onClick={confirm}>Confirm</Button>
                        </Stack>
                    </Stack>
                }
                {loading && <CircularProgress />}
                {fileID && 
                    <Stack alignItems="center" spacing={2} direction="column">
                        <Box>Successfully added <a href={"http://localhost:8080/" + fileID} target="_blank">{file.name}</a></Box>
                        <Stack spacing={2} direction="row">
                            <Button variant='contained' onClick={cancel}>Back</Button>
                            <Button variant='contained' color='secondary' onClick={() => navigate("/segment/" + fileID)}>Segment</Button>
                        </Stack>
                    </Stack>
                }
            </div>
        </>
    );
}

export default ImageUpload;
