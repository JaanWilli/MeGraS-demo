import { Box, Button, CircularProgress, Stack } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router';
import { useNavigate } from "react-router";

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MediaSegmentDetails from './MediaSegmentDetails';
import ImageSegmentDetails from './ImageSegmentDetails';

const MediaDetails = () => {
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
        if (response.ok) {
            return navigate("/")
        } else {
            console.log(response.statusText)
        }
    }

    return (
        <>
            <div className='App-title'>
                Media Details
            </div>
            <div className="App-content">
                {loading && <CircularProgress />}
                {filename && filetype &&
                    <Stack spacing={3} alignItems="center" direction="column">
                        {filetype.startsWith("image") ?
                            <ImageSegmentDetails
                                objectId={objectId}
                                setLoading={setLoading}
                            />
                            :
                            <MediaSegmentDetails
                                objectId={objectId}
                                setLoading={setLoading}
                                filetype={filetype}
                                filename={filename}
                            />
                        }
                        {!loading &&
                            <>
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
                                <Button
                                    variant='contained'
                                    color='secondary'
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate("/segment/" + objectId)}
                                >
                                    Add segment
                                </Button>
                            </>
                        }
                    </Stack>
                }
                {!loading && filetype && !filetype.startsWith("image")

                }
            </div>
        </>
    )
}

export default MediaDetails;