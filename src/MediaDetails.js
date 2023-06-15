import { Box, Button, CircularProgress, Stack } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router';
import { useNavigate } from "react-router";

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MediaSegmentDetails from './MediaSegmentDetails';
import ImageSegmentDetails from './ImageSegmentDetails';
import { BACKEND_ERR } from './Errors';

const MediaDetails = ({ triggerSnackbar }) => {
    const { objectId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(true);
    const [filename, setFilename] = React.useState()
    const [filetype, setFiletype] = React.useState()

    React.useEffect(() => {
        async function fetchMedia() {
            const options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": ["<http://localhost:8080/" + objectId + ">"],
                    "p": [],
                    "o": []
                })
            }
            let response = await fetch("http://localhost:8080/query/quads", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let data = await response.json()

            data.results.forEach((res) => {
                if (res.p === "<http://megras.org/schema#canonicalMimeType>") {
                    setFiletype(res.o.replace("^^String", ""))
                } else if (res.p === "<http://megras.org/schema#fileName>") {
                    setFilename(res.o.replace("^^String", ""))
                }
            })

            console.log(data)
        }

        fetchMedia();
        return () => { }
    }, [])

    const deleteMedium = async () => {
        let response = await fetch("http://localhost:8080/" + objectId, { method: 'DELETE' })
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        if (response.ok) {
            return navigate("/")
        } else {
            console.log(response.statusText)
        }
    }

    const details = (
        <Stack spacing={3} alignItems="center" direction="column">
            <Stack direction="column">
                <Box>{filename}</Box>
                <Box>{filetype}</Box>
            </Stack>
            <Button
                variant='contained'
                color='warning'
                startIcon={<DeleteIcon />}
                onClick={deleteMedium}
            >
                Delete Medium
            </Button>
            {["image/png", "video/webm"].includes(filetype) &&
                <Button
                    variant='contained'
                    color='secondary'
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/segment/" + objectId)}
                >
                    Add segment
                </Button>
            }
        </Stack>
    )

    return (
        <>
            <div className='App-title'>
                Media Details
            </div>
            <div className="App-content">
                {loading && <CircularProgress />}
                {filename && filetype &&
                    <>
                        {filetype.startsWith("image") ?
                            <ImageSegmentDetails
                                triggerSnackbar={triggerSnackbar}
                                objectId={objectId}
                                setLoading={setLoading}
                                details={details}
                            />
                            :
                            <MediaSegmentDetails
                                triggerSnackbar={triggerSnackbar}
                                objectId={objectId}
                                loading={loading}
                                setLoading={setLoading}
                                filetype={filetype}
                                filename={filename}
                                details={details}
                            />
                        }
                    </>
                }
            </div>
        </>
    )
}

export default MediaDetails;