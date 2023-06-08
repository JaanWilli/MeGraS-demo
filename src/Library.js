import { Button, CircularProgress, Grid, IconButton } from "@mui/material";
import React from "react";
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from "react-router";

const Library = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(true);
    const [media, setMedia] = React.useState([])
    const [groupedMedia, setGroupedMedia] = React.useState([])
    const [selected, setSelected] = React.useState()
    const [segments, setSegments] = React.useState([])

    React.useEffect(() => {
        async function fetchMedia() {
            const options = {
                method: 'POST',
                body: JSON.stringify({
                    "quadValue": "<http://megras.org/schema#rawId>"
                })
            }
            let response = await fetch("http://localhost:8080/query/predicate", options)
            let data = await response.json()

            console.log(data)

            if (!ignore) {
                let mediaArray = data.results.map(d => d.s.replace("<", "").replace(">", ""))
                setMedia(mediaArray)
                let grouped = mediaArray.reduce((r, e, i) =>
                    (i % 4 ? r[r.length - 1].push(e) : r.push([e])) && r
                    , [])
                console.log(grouped)
                setGroupedMedia(grouped)
                setLoading(false)
            }
        }
        let ignore = false;
        fetchMedia();
        return () => {
            ignore = true;
        }
    }, [])

    const select = async (medium) => {
        if (selected === medium) {
            setSelected()
            setSegments()
        } else {
            setSelected(medium)

            const options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": [],
                    "p": ["<http://megras.org/schema#segmentOf>"],
                    "o": ["<" + medium + ">"]
                })
            }
            let response = await fetch("http://localhost:8080/query/quads", options)
            let data = await response.json()

            console.log(data)
            setSegments(data.results.map(d => d.s.replace("<", "").replace(">", "")))
        }
    }

    const addSegment =
        <Button
            onClick={() => navigate("/segment/" + selected.replace("http://localhost:8080/", ""))}
            sx={{ color: 'white' }}
        >
            <AddIcon /> Add
        </Button>

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
                    {groupedMedia.map((g, gi) => {
                        var subgrid;
                        if (g.includes(selected) && segments) {
                            if (segments.length == 0) {
                                subgrid =
                                    <Grid
                                        item xs={12}
                                        justifyContent='center'
                                        alignItems='center'
                                        margin={2}
                                        paddingBottom={2}
                                        style={{ backgroundColor: '#6a6d75', borderRadius: 30 }}
                                    >
                                        {addSegment}
                                    </Grid>
                            } else {
                                subgrid =
                                    <Grid
                                        container
                                        margin={2}
                                        spacing={2}
                                        justifyContent='center'
                                        alignItems='center'
                                        style={{ backgroundColor: '#6a6d75', borderRadius: 30 }}
                                    >
                                        {segments.map((s, si) => (
                                            <Grid item xs={3}>
                                                <a href={s} target="_blank">
                                                    <img src={s + "/preview"} key={si} height='120vh' width='120vw' style={{objectFit: 'scale-down'}} />
                                                </a>
                                            </Grid>
                                        ))}
                                        <Grid item xs={3}>
                                            {addSegment}
                                        </Grid>
                                    </Grid>
                            }
                        }
                        return (
                            <>
                                {
                                    g.map((m, i) => (
                                        <Grid item xs={3}>
                                            <img
                                                src={m + "/preview"}
                                                key={gi + i}
                                                onClick={() => select(m)}
                                                style={{ cursor: 'pointer', border: m === selected ? '10px solid #6a6d75' : "" }} />
                                        </Grid>))
                                }
                                < React.Fragment >
                                    {subgrid}
                                </React.Fragment>
                            </>
                        )
                    })}
                </Grid>
            </div >
        </>
    )
}

export default Library;