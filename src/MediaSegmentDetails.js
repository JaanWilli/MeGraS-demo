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

    return (
        <>
            <FileDisplay
                filedata={BACKEND_URL + "/" + objectId}
                filetype={filetype}
            />
            <br />
            {!loading && details}
        </>
    )
}

export default MediaSegmentDetails;