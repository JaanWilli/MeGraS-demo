import { Autocomplete, Grid, Paper, TextField } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router";
import FileDisplay from "./FileDisplay";
import { BACKEND_ERR } from "./Errors";


const Library = ({ triggerSnackbar }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(true);
    const [media, setMedia] = React.useState([])
    const [mediaTypes, setMediaTypes] = React.useState([])
    const [selectedType, setSelected] = React.useState()


    const mimeToMediaType = new Map([
        ["image/png", "Image"],
        ["video/webm", "Video"],
        ["audio/webm", "Audio"],
    ])

    React.useEffect(() => {
        async function fetchMedia() {
            var options = {
                method: 'POST',
                body: JSON.stringify({
                    "quadValue": "<http://megras.org/schema#rawId>"
                })
            }
            var response = await fetch("http://localhost:8080/query/predicate", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let uris = await response.json()

            options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": uris.results.map(d => d.s),
                    "p": ["<http://megras.org/schema#canonicalMimeType>"],
                    "o": []
                })
            }
            response = await fetch("http://localhost:8080/query/quads", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let mimetypeResults = await response.json()

            console.log(mimetypeResults)
            let mimetypes = mimetypeResults.results.map(m => mimeToMediaType.get(m.o.replace("^^String", "")))
            setMediaTypes([...new Set(mimetypes)])

            if (!ignore) {
                let mediaArray = mimetypeResults.results.map(d => ({
                    url: d.s.replace("<", "").replace(">", ""),
                    type: d.o.replace("^^String", "")
                }))
                setMedia(mediaArray)
                setLoading(false)
            }
        }
        let ignore = false;
        fetchMedia();
        return () => {
            ignore = true;
        }
    }, [])

    return (
        <>
            <div className='App-title'>
                My Library
                <Autocomplete className='App-subtitle'
                    disablePortal
                    options={mediaTypes}
                    sx={{ width: 300 }}
                    onChange={(e, v) => setSelected(v)}
                    renderInput={(params) => <TextField {...params} label="Media Type" />}
                />
            </div>
            <div className="App-content">
                <Grid
                    container
                    maxWidth={'60vw'}
                    justifyContent='center'
                    alignItems='center'
                    spacing={2}
                >
                    {media.map((m, i) => {
                        return (
                            !selectedType || mimeToMediaType.get(m.type) === selectedType ?
                                <Grid item xs={2}>
                                    <Paper elevation={3} onClick={() => navigate(m.url.replace("http://localhost:8080", ""))} sx={{ height: '16vh', cursor: 'pointer' }}>
                                        <FileDisplay
                                            isPreview={true}
                                            filedata={m.url}
                                            filetype={m.type}
                                        />
                                    </Paper>
                                </Grid>
                                : null
                        )
                    })}
                </Grid>
            </div >
        </>
    )
}

export default Library;