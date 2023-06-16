import { Box, Button, CircularProgress, IconButton, Stack, TextField } from '@mui/material';
import './App.css';
import React from 'react';
import { useNavigate } from 'react-router';
import FileDisplay from './FileDisplay';
import FileSelect from './FileSelect';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { BACKEND_ERR, PREDICTOR_ERR } from './Errors';


const ImageUpload = ({ triggerSnackbar }) => {
    const navigate = useNavigate();

    const [file, setFile] = React.useState();
    const [filedata, setFiledata] = React.useState();
    const [filetype, setFiletype] = React.useState();
    const [fileID, setFileID] = React.useState();
    const [caption, setCaption] = React.useState();
    const [captionLoading, setCaptionLoading] = React.useState(false);
    const [captionSent, setCaptionSent] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const handleFileUpload = (files) => {
        if (files.length == 1) {
            setFile(files[0])
            setFiledata(URL.createObjectURL(files[0]))
            setFiletype(files[0].type)
        }
    };

    const cancel = () => {
        setFile()
        setFiledata()
        setFiletype()
        setFileID()
        setCaption()
        setCaptionSent(false)
    }

    const generateCaption = async () => {
        setCaptionLoading(true)
        let response = await fetch("http://localhost:5000/caption/" + fileID)
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (response == undefined) return
        let caption = await response.text()
        setCaption(caption)
        setCaptionLoading(false)
    }

    const sendCaption = async () => {
        let embed_response = await fetch("http://localhost:5000/embedding/" + caption)
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (embed_response == undefined) return
        let embedding = await embed_response.text()

        var options = {
            method: 'POST',
            body: JSON.stringify({
                "quads": [{
                    "s": "<http://localhost:8080/" + fileID + ">",
                    "p": "<http://megras.org/schema#captionVector>",
                    "o": embedding.trim()
                }]
            })
        }
        let response = await fetch("http://localhost:8080/add/quads", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        console.log(response)
        if (response.ok) {
            setCaptionSent(true)
        }
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
            .catch(e => triggerSnackbar(BACKEND_ERR, "error"))
    };

    return (
        <>
            <div className='App-title'>
                File Upload
                <div className='App-subtitle'>Add a new media document to the library.</div>
            </div>
            <div className="App-content">
                {!file &&
                    <FileSelect
                        handleFileUpload={handleFileUpload}
                        multiple={false}
                    />
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
                        {filetype.startsWith("image") &&
                            <>
                                <img src={"http://localhost:8080/" + fileID} />
                                {!captionSent &&
                                    <Stack spacing={2} mt={2} direction="row" alignItems="center">
                                        <Box>Caption:</Box>
                                        <TextField sx={{ width: '20vw' }} multiline value={caption} onChange={(e) => setCaption(e.target.value)} />
                                        {captionLoading ?
                                            <CircularProgress />
                                            :
                                            <IconButton onClick={generateCaption}><AutoAwesomeIcon /></IconButton>
                                        }
                                        <Button variant='contained' color='secondary' disabled={!caption} onClick={sendCaption}>Send</Button>
                                    </Stack>
                                }
                            </>
                        }
                        <Stack spacing={2} direction="row">
                            <Button variant='contained' onClick={cancel}>Back</Button>
                            {["image/png", "video/webm", "audio/webm"].includes(filetype) &&
                                <Button variant='contained' color='secondary' onClick={() => navigate("/segment/" + fileID)}>Segment</Button>
                            }
                        </Stack>
                    </Stack>
                }
            </div>
        </>
    );
}

export default ImageUpload;
