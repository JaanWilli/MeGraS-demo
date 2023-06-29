import { Box, Button, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import React from 'react';
import { useLocation, useParams } from 'react-router';
import { useNavigate } from "react-router";

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import MediaSegmentDetails from './MediaSegmentDetails';
import ImageSegmentDetails from './ImageSegmentDetails';
import { BACKEND_ERR } from './Errors';
import { BACKEND_URL } from './Api';
import FileDisplay from './FileDisplay';

const MediaDetails = ({ triggerSnackbar }) => {
    const objectId = useParams()["*"];
    const navigate = useNavigate();
    const location = useLocation()

    const [loading, setLoading] = React.useState(true);
    const [filename, setFilename] = React.useState()
    const [rawfiletype, setRawFiletype] = React.useState()
    const [filetype, setFiletype] = React.useState()
    const [dimensions, setDimensions] = React.useState()
    const [segmenttype, setSegmentType] = React.useState()
    const [segmentOf, setSegmentOf] = React.useState()
    const [captions, setCaptions] = React.useState([])
    const [category, setCategory] = React.useState()
    const [similar, setSimilar] = React.useState([])

    const [segments, setSegments] = React.useState([])

    React.useEffect(() => {
        async function fetchMedia() {
            let options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": ["<" + BACKEND_URL + "/" + objectId + ">"],
                    "p": [],
                    "o": []
                })
            }
            let response = await fetch(BACKEND_URL + "/query/quads", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let data = await response.json()

            let c = []
            let embed = null
            data.results.forEach((res) => {
                if (res.p === "<http://megras.org/schema#canonicalMimeType>") {
                    setFiletype(res.o.replace("^^String", ""))
                } else if (res.p === "<http://megras.org/schema#rawMimeType>") {
                    setRawFiletype(res.o.replace("^^String", ""))
                } else if (res.p === "<http://megras.org/schema#fileName>") {
                    setFilename(res.o.replace("^^String", ""))
                } else if (res.p === "<https://schema.org/caption>") {
                    c.push(res.o.replace("^^String", ""))
                } else if (res.p === "<http://megras.org/schema#bounds>") {
                    let dim = res.o.replace("^^String", "").split(",")
                    dim = dim.filter((d, i) => d !== "-" && i % 2 == 1)
                    setDimensions(dim.join(" x "))
                } else if (res.p === "<http://megras.org/schema#segmentType>") {
                    setSegmentType(res.o.replace("^^String", ""))
                } else if (res.p === "<https://schema.org/category>") {
                    setCategory(res.o.replace("^^String", ""))
                } else if (res.p === "<http://megras.org/schema#segmentOf>") {
                    setSegmentOf(res.o.replace("<", "").replace(">", ""))
                } else if (res.p === "<http://megras.org/schema#categoryVector>" ||
                    res.p === "<http://megras.org/schema#captionVector>") {
                    embed = res.o.replace("[", "").replace("]^^DoubleVector", "").split(",")
                }
            })
            setCaptions(c)

            let isSegment = objectId.includes("/c/")
            if (isSegment) {
                let options = {
                    method: 'POST',
                    body: JSON.stringify({
                        "s": ["<" + BACKEND_URL + "/" + objectId.slice(0, objectId.indexOf("/")) + ">"],
                        "p": ["<http://megras.org/schema#canonicalMimeType>", "<http://megras.org/schema#fileName>"],
                        "o": []
                    })
                }
                let response = await fetch(BACKEND_URL + "/query/quads", options)
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
            }

            if (embed) {
                let pred = isSegment ? "<http://megras.org/schema#categoryVector>" : "<http://megras.org/schema#captionVector>"
                let options = {
                    method: 'POST',
                    body: JSON.stringify({
                        "predicate": pred,
                        "object": embed,
                        "count": 3,
                        "distance": "COSINE"
                    })
                }
                let response = await fetch(BACKEND_URL + "/query/knn", options)
                    .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
                if (response == undefined) return
                let data = await response.json()

                let urls = new Set()
                data.results.forEach(r => {
                    if (r.s.startsWith("<") &&
                        r.s.replace("<" + BACKEND_URL + "/", "").replace(">", "") !== objectId) {
                        urls.add(r.s)
                    }
                })
                setSimilar(Array.from(urls))
            }
        }

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
                setSegments(data.results.map(r => ({ url: r.s, category: "" })))
            }
        }

        fetchMedia();
        fetchSegments();
        return () => { }
    }, [location.key])

    const deleteMedium = async () => {
        let response = await fetch(BACKEND_URL + "/" + objectId, { method: 'DELETE' })
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        if (response.ok) {
            return navigate("/")
        } else {
            console.log(response.statusText)
        }
    }

    const selectOf = () => {
        if (segmentOf) {
            let uri = segmentOf.replace(BACKEND_URL, "")
            return navigate(uri)
        }
    }

    const selectSegment = (url) => {
        let uri = url.replace("<" + BACKEND_URL, "").replace(">", "")
        return navigate(uri)
    }

    const details = (
        <Stack spacing={3} alignItems="center" direction="column" mb={6}>
            <Stack direction="row" spacing={2}>
                <Button
                    variant='contained'
                    color='warning'
                    startIcon={<DeleteIcon />}
                    onClick={deleteMedium}
                >
                    Delete
                </Button>
                {["image/png", "video/webm", "audio/webm"].includes(filetype) &&
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
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ verticalAlign: 'center' }}>Source</TableCell>
                            <TableCell>
                                <Button onClick={() => window.open(BACKEND_URL + "/" + objectId, "_blank")} startIcon={<OpenInNewIcon />} >Open</Button>
                            </TableCell>
                        </TableRow>
                        {filename && <TableRow>
                            <TableCell>File name</TableCell>
                            <TableCell>{filename}</TableCell>
                        </TableRow>}
                        {filetype && <TableRow>
                            <TableCell>File type</TableCell>
                            <TableCell>{filetype}</TableCell>
                        </TableRow>}
                        {rawfiletype && <TableRow>
                            <TableCell>Raw file type</TableCell>
                            <TableCell>{rawfiletype}</TableCell>
                        </TableRow>}
                        {dimensions && <TableRow>
                            <TableCell>Dimensions</TableCell>
                            <TableCell>{dimensions}</TableCell>
                        </TableRow>}
                        {captions.length > 0 &&
                            <TableRow>
                                <TableCell>Captions</TableCell>
                                <TableCell>
                                    <Stack direction="column">
                                        {captions.map((c) => (
                                            <Box>{c}</Box>
                                        ))}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        }
                        {segmenttype && <TableRow>
                            <TableCell>Segment Type</TableCell>
                            <TableCell>{segmenttype}</TableCell>
                        </TableRow>}
                        {category && <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell>{category}</TableCell>
                        </TableRow>}
                        {segmentOf && <TableRow>
                            <TableCell>Segment of</TableCell>
                            <TableCell sx={{ cursor: 'pointer' }} onClick={selectOf}><FileDisplay isPreview filedata={segmentOf} filetype={"image"} /></TableCell>
                        </TableRow>}
                        {filetype && !filetype.startsWith("image") && <TableRow>
                            <TableCell style={{ verticalAlign: 'top' }}>Segments</TableCell>
                            <TableCell>
                                <Stack direction="column">
                                    {segments.map((s) => (
                                        <Box sx={{ cursor: 'pointer' }} onClick={() => selectSegment(s.url)}>
                                            <FileDisplay filedata={s.url.replace("<", "").replace(">", "")} filetype={"image"} />
                                        </Box>
                                    ))}
                                </Stack>
                            </TableCell>
                        </TableRow>}
                        {similar.length > 0 && <TableRow>
                            <TableCell style={{ verticalAlign: 'top' }}>Similar Media Items</TableCell>
                            <TableCell>
                                <Stack direction="column">
                                    {similar.map((s) => (
                                        <Box sx={{ cursor: 'pointer' }} onClick={() => selectSegment(s)}>
                                            <FileDisplay isPreview filedata={s.replace("<", "").replace(">", "")} filetype={"image"} />
                                        </Box>
                                    ))}
                                </Stack>
                            </TableCell>
                        </TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>
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