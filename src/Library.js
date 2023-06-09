import { CircularProgress, Grid, Paper } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router";
import FileDisplay from "./FileDisplay";


const Library = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(true);
    const [media, setMedia] = React.useState([])
    const [selected, setSelected] = React.useState()

    React.useEffect(() => {
        async function fetchMedia() {
            var options = {
                method: 'POST',
                body: JSON.stringify({
                    "quadValue": "<http://megras.org/schema#rawId>"
                })
            }
            var response = await fetch("http://localhost:8080/query/predicate", options)
            let uris = await response.json()

            console.log(uris)
            
            options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": uris.results.map(d => d.s),
                    "p": ["<http://megras.org/schema#canonicalMimeType>"],
                    "o": []
                })
            }
            response = await fetch("http://localhost:8080/query/quads", options)
            let mimetypes = await response.json()

            console.log(mimetypes)

            if (!ignore) {
                let mediaArray = mimetypes.results.map(d => ({
                    url: d.s.replace("<", "").replace(">", ""),
                    type: d.o.replace("^^String", "")
                }))
                console.log(mediaArray)
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
                <div className='App-subtitle'>Click on a medium to display existing segments.</div>
            </div>
            <div className="App-content">
                {loading && <CircularProgress />}
                <Grid
                    container
                    maxWidth={'60vw'}
                    justifyContent='center'
                    alignItems='center'
                    spacing={2}
                >
                    {media.map((m, i) => (
                        <Grid item xs={2}>
                            <Paper elevation={3} onClick={() => navigate(m.url.replace("http://localhost:8080", ""))} sx={{ height: '16vh', cursor: 'pointer' }}>
                                <FileDisplay
                                isPreview={true}
                                filedata={m.url}
                                filetype={m.type}
                                
                                />
                            </Paper>
                        </Grid>))
                    }
                </Grid>
            </div >
        </>
    )
}

export default Library;