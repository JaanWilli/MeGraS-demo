import { Box, Button, CircularProgress, Stack } from '@mui/material';
import './App.css';
import React from 'react';
import { useNavigate } from 'react-router';
import FileDisplay from './FileDisplay';
import FileSelect from './FileSelect';

import { BACKEND_ERR } from './Errors';
import { BACKEND_URL } from './Api';


const ImageUpload = ({ triggerSnackbar }) => {
    const navigate = useNavigate();

    const [file, setFile] = React.useState();
    const [filedata, setFiledata] = React.useState();
    const [filetype, setFiletype] = React.useState();

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
    }

    const confirm = () => {
        setLoading(true)

        var data = new FormData()
        data.append("file", file)
        const filename = file["name"]

        fetch(BACKEND_URL + "/add/file", { method: 'POST', body: data })
            .then(response => response.json())
            .then(data => {
                setLoading(false)
                return navigate("/" + data[filename]["uri"])
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
                {loading ? <CircularProgress /> :
                    <>
                        {file ?
                            <Stack spacing={2} direction="column" alignItems="center">
                                <Box>{file.name}</Box>
                                <FileDisplay filetype={filetype} filedata={filedata} />
                                <Stack spacing={2} mt={2} direction="row">
                                    <Button variant='contained' onClick={cancel}>Cancel</Button>
                                    <Button variant='contained' color='secondary' onClick={confirm}>Confirm</Button>
                                </Stack>
                            </Stack>
                            :
                            <FileSelect
                                handleFileUpload={handleFileUpload}
                                multiple={false}
                            />
                        }
                    </>
                }
            </div>
        </>
    );
}

export default ImageUpload;
