import { Box, Grid, Paper } from '@mui/material';
import React from 'react';
import FileDisplay from './FileDisplay';


const MediaSegmentDetails = ({ objectId, setLoading, filetype, filename }) => {

    const [segments, setSegments] = React.useState([])

    React.useEffect(() => {
        async function fetchSegments() {
            let options = {
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

            options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": data.results.map(d => d.s),
                    "p": ["<https://schema.org/category>", "<http://megras.org/schema#segmentBounds>"],
                    "o": []
                })
            }
            response = await fetch("http://localhost:8080/query/quads", options)
            data = await response.json()

            setSegments(data.results.map(d => d.s))
        }

        fetchSegments();
        setLoading(false);
        return () => {}
    }, [])

    const segmentGrid = () => (
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
                            src={s.url.replace("<", "").replace(">", "")}
                            key={i}
                            height='80%' width='100%' style={{ objectFit: 'scale-down' }}
                        />
                        <Box>{s.category}</Box>
                    </Paper>
                </Grid>))
            }
        </Grid>
    )

    return (
        <FileDisplay
            filedata={"http://localhost:8080/" + objectId}
            filetype={filetype}
            filename={filename}
        />
    )
}

export default MediaSegmentDetails;