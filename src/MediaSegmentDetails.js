import { Box, Grid, IconButton, Paper, Stack } from '@mui/material';
import React from 'react';
import FileDisplay from './FileDisplay';
import { BACKEND_ERR } from './Errors';
import DeleteIcon from '@mui/icons-material/Delete';
import { BACKEND_URL } from './Api';


const MediaSegmentDetails = (props) => {
    const { triggerSnackbar, objectId, loading, setLoading, filetype, filename, details } = props

    const [segments, setSegments] = React.useState([])

    React.useEffect(() => {
        async function fetchSegments() {
            let options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": [],
                    "p": ["<http://megras.org/schema#segmentOf>"],
                    "o": ["<" + BACKEND_URL + "/" + objectId + ">"]
                })
            }
            let response = await fetch(BACKEND_URL + "/query/quads", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let data = await response.json()

            console.log(data)

            options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": data.results.map(d => d.s),
                    "p": ["<https://schema.org/category>"],
                    "o": []
                })
            }
            response = await fetch(BACKEND_URL + "/query/quads", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let category_data = await response.json()

            if (category_data.results.length > 0) {
                setSegments(category_data.results.map(d => ({ url: d.s, category: d.o.replace("^^String", "") })))
            } else {
                setSegments(data.results.map(r => ({url: r.s, category: ""})))
            }
        }

        fetchSegments();
        setLoading(false);
        return () => { }
    }, [])

    const deleteSegment = async (i) => {
        let toDelete = segments[i]
        console.log(toDelete)
        let id = toDelete.url.replace("<" + BACKEND_URL + "/", "").replace(">", "")
        let response = await fetch(BACKEND_URL + "/" + id, { method: 'DELETE' })
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        if (response.ok) {
            let newSegments = [...segments]
            newSegments.splice(i, 1)
            setSegments(newSegments)
            console.log(newSegments)
        } else {
            console.log(response.statusText)
        }
    }

    return (
        <>
            <FileDisplay
                filedata={BACKEND_URL + "/" + objectId}
                filetype={filetype}
                filename={filename}
            />
            {!loading && details}
            <Grid
                container
                maxWidth={'60vw'}
                justifyContent='center'
                alignItems='center'
                spacing={2}
                mt={2}
                mb={5}
            >
                {segments.map((s, i) => (
                    <Grid item xs={2}>
                        <Paper elevation={3} sx={{ height: '16vh' }}>
                            <img
                                src={s.url.replace("<", "").replace(">", "") + "/preview"}
                                key={i}
                                height='80%' width='100%'
                                style={{ objectFit: 'scale-down', cursor: 'pointer' }}
                                onClick={() => window.open(s.url.replace("<", "").replace(">", ""), "_blank")}
                            />
                            <IconButton onClick={() => deleteSegment(i)}><DeleteIcon /></IconButton>
                        </Paper>
                    </Grid>))
                }
            </Grid>
        </>
    )
}

export default MediaSegmentDetails;