import { Box, Button, CircularProgress, Grid, Paper, Stack } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router';
import { useNavigate } from "react-router";
import FileDisplay from './FileDisplay';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';


const MediaDetails = () => {
    const { objectId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(true);
    const [filename, setFilename] = React.useState()
    const [filetype, setFiletype] = React.useState()

    const [segments, setSegments] = React.useState([])

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

        async function fetchSegments() {
            const options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": [],
                    "p": ["<http://megras.org/schema#segmentOf>"],
                    "o": ["<http://localhost:8080/" + objectId + ">"]
                })
            }
            let response = await fetch("http://localhost:8080/query/quads", options)
            let data = await response.json()

            console.log(data)
            setSegments(data.results.map(d => d.s.replace("<", "").replace(">", "")))
        }

        let ignore = false;
        fetchMedia();
        fetchSegments();
        setLoading(false);
        return () => {
            ignore = true;
        }
    }, [])

    const deleteMedium = async () => {
        let response = await fetch("http://localhost:8080/" + objectId, {method: 'DELETE'})
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
                {!loading && filename && filetype &&
                    <Stack spacing={3} alignItems="center" direction="column">
                        <FileDisplay
                            filedata={"http://localhost:8080/" + objectId}
                            filetype={filetype}
                            filename={filename}
                        />
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
                    </Stack>
                }
                {!loading && segments &&
                    <Grid
                        container
                        maxWidth={'60vw'}
                        justifyContent='center'
                        alignItems='center'
                        spacing={2}
                        mt={2}
                    >
                        {segments.map((s, i) => (
                            <Grid item xs={2}>
                                <Paper elevation={3} sx={{ height: '16vh' }}>
                                    <img
                                        src={s + "/preview"}
                                        key={i}
                                        height='100%' width='100%' style={{ objectFit: 'scale-down' }}
                                    />
                                </Paper>
                            </Grid>))
                        }
                    </Grid>
                }
            </div>
        </>
    )
}

export default MediaDetails;