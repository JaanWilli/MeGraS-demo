import { Box, Button, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableRow, TextField } from '@mui/material';
import React from 'react';
import { useLocation, useParams } from 'react-router';
import { useNavigate } from "react-router";

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';

import MediaSegmentDetails from './MediaSegmentDetails';
import ImageSegmentDetails from './ImageSegmentDetails';
import { BACKEND_ERR, PREDICTOR_ERR } from './Errors';
import { BACKEND_URL, PREDICTOR_URL } from './Api';
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
    const [segmenttype, setSegmentType] = React.useState([])
    const [segmentDefinition, setSegmentDefinition] = React.useState([])
    const [segmentOf, setSegmentOf] = React.useState([])
    const [captions, setCaptions] = React.useState([])
    const [category, setCategory] = React.useState()
    const [intersectable, setIntersectable] = React.useState([])
    const [unionable, setUnionable] = React.useState([])
    const [similar, setSimilar] = React.useState([])

    const [tempCategory, setTempCategory] = React.useState()
    const [tempCaption, setTempCaption] = React.useState()
    const [captionLoading, setCaptionLoading] = React.useState(false)
    const [combinationLoading, setCombinationLoading] = React.useState(false);

    const [segments, setSegments] = React.useState([])

    const [selectIntersect, setSelectIntersect] = React.useState();
    const [selectUnion, setSelectUnion] = React.useState();

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
            let segType = []
            let segDef = []
            let embed = null
            let bounds = []
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
                    segType.push(res.o.replace("^^String", ""))
                } else if (res.p === "<http://megras.org/schema#segmentDefinition>") {
                    segDef.push(res.o.replace("^^String", ""))
                } else if (res.p === "<https://schema.org/category>") {
                    setCategory(res.o.replace("^^String", ""))
                } else if (res.p === "<http://megras.org/schema#categoryVector>" ||
                    res.p === "<http://megras.org/schema#captionVector>") {
                    embed = res.o.replace("[", "").replace("]^^DoubleVector", "").split(",")
                } else if (res.p === "<http://megras.org/schema#segmentBounds>") {
                    bounds = res.o.replace("^^String", "").split(",").map(b => Number(b))
                }
            })
            setCaptions(c)
            setSegmentDefinition(segDef)
            setSegmentType(segType)

            let isSegment = objectId.includes("/c/")
            if (isSegment) {
                // find segmentOf of segment
                let options = {
                    method: 'POST',
                    body: JSON.stringify({
                        "seeds": ["<" + BACKEND_URL + "/" + objectId + ">"],
                        "predicates": ["<http://megras.org/schema#segmentOf>"],
                        "maxDepth": 5
                    })
                }
                let response = await fetch(BACKEND_URL + "/query/path", options)
                    .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
                if (response == undefined) return
                let data = await response.json()
                let segOf = data.results.map((r) => r.o.replace("<", "").replace(">", ""))
                setSegmentOf([...new Set(segOf)])

                // find filetype and filename of segment
                options = {
                    method: 'POST',
                    body: JSON.stringify({
                        "s": ["<" + BACKEND_URL + "/" + objectId.slice(0, objectId.indexOf("/")) + ">"],
                        "p": ["<http://megras.org/schema#canonicalMimeType>", "<http://megras.org/schema#fileName>"],
                        "o": []
                    })
                }

                response = await fetch(BACKEND_URL + "/query/quads", options)
                    .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
                if (response == undefined) return
                data = await response.json()
                data.results.forEach((res) => {
                    if (res.p === "<http://megras.org/schema#canonicalMimeType>") {
                        setFiletype(res.o.replace("^^String", ""))
                    } else if (res.p === "<http://megras.org/schema#fileName>") {
                        setFilename(res.o.replace("^^String", ""))
                    }
                })

                options = {
                    method: 'POST',
                    body: JSON.stringify({
                        "s": [],
                        "p": ["<http://megras.org/schema#segmentOf>"],
                        "o": segOf.map(s => "<" + s + ">")
                    })
                }
                response = await fetch(BACKEND_URL + "/query/quads", options)
                    .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
                if (response == undefined) return
                data = await response.json()
                let sisterSegments = data.results.map(r => r.s)
                setUnionable(sisterSegments.filter(s => s != "<" + BACKEND_URL + "/" + objectId + ">"))
                let intersect = []
                for (const res of data.results) {
                    if (res.s !== "<" + BACKEND_URL + "/" + objectId + ">") {
                        options = {
                            method: 'POST',
                            body: JSON.stringify({
                                "s": [res.s],
                                "p": ["<http://megras.org/schema#segmentBounds>"],
                                "o": []
                            })
                        }
                        response = await fetch(BACKEND_URL + "/query/quads", options)
                            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
                        if (response == undefined) return
                        data = await response.json()
                        let other = data.results[0].o.replace("^^String", "").split(",").map(b => Number(b))
                        let valid = true
                        for (let i = 0; i < other.length; i++) {
                            if (!isNaN(bounds[i]) && !isNaN(other[i])) {
                                valid = false
                            }
                        }
                        valid = valid || (!isNaN(bounds[0]) && !isNaN(other[0]) && bounds[0] <= other[1] && bounds[1] >= other[0]) ||
                        (!isNaN(bounds[2]) && !isNaN(other[2]) && bounds[2] <= other[3] && bounds[3] >= other[2]) ||
                        (!isNaN(bounds[4]) && !isNaN(other[4]) && bounds[4] <= other[5] && bounds[5] >= other[4]) ||
                        (!isNaN(bounds[6]) && !isNaN(other[6]) && bounds[6] <= other[7] && bounds[7] >= other[6])
                        if (valid) {
                            intersect.push(res.s)
                        }
                    }
                }
                setIntersectable(intersect)
            }

            if (embed) {
                let pred = isSegment ? "<http://megras.org/schema#categoryVector>" : "<http://megras.org/schema#captionVector>"
                let options = {
                    method: 'POST',
                    body: JSON.stringify({
                        "predicate": pred,
                        "object": embed,
                        "count": 2,
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
            let segment_data = await response.json()

            if (segment_data.results.length > 0) {
                setSegments(segment_data.results.map(d => ({ url: d.s, category: d.o.replace("^^String", "") })))
            } else {
                setSegments(data.results.map(r => ({ url: r.s, category: "" })))
            }
        }

        fetchMedia();
        fetchSegments();
        return () => { }
    }, [location.key])

    const generateCaption = async () => {
        setCaptionLoading(true)
        let response = await fetch(PREDICTOR_URL + "/caption/" + objectId)
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (response == undefined) return
        let caption = await response.text()
        setTempCaption(caption)
        setCaptionLoading(false)
    }

    const sendCaption = async () => {
        let embed_response = await fetch(PREDICTOR_URL + "/embedding/" + tempCaption)
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (embed_response == undefined) return
        let embedding = await embed_response.text()

        var options = {
            method: 'POST',
            body: JSON.stringify({
                "quads": [{
                    "s": "<" + BACKEND_URL + "/" + objectId + ">",
                    "p": "<https://schema.org/caption>",
                    "o": tempCaption + "^^String"
                },
                {
                    "s": "<" + BACKEND_URL + "/" + objectId + ">",
                    "p": "<http://megras.org/schema#captionVector>",
                    "o": embedding.trim()
                }
                ]
            })
        }
        let response = await fetch(BACKEND_URL + "/add/quads", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        if (response.ok) {
            setCaptions([tempCaption])
        }
    }

    const sendCategory = async () => {
        let embed_response = await fetch(PREDICTOR_URL + "/embedding/" + tempCategory)
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (embed_response == undefined) return
        let embedding = await embed_response.text()

        var options = {
            method: 'POST',
            body: JSON.stringify({
                "quads": [{
                    "s": "<" + BACKEND_URL + "/" + objectId + ">",
                    "p": "<https://schema.org/category>",
                    "o": tempCategory + "^^String"
                },
                {
                    "s": "<" + BACKEND_URL + "/" + objectId + ">",
                    "p": "<http://megras.org/schema#categoryVector>",
                    "o": embedding.trim()
                }
                ]
            })
        }
        let response = await fetch(BACKEND_URL + "/add/quads", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response.ok) {
            setCategory(tempCategory)
        }
    }

    const deleteMedium = async () => {
        let response = await fetch(BACKEND_URL + "/" + objectId, { method: 'DELETE' })
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        if (response.ok) {
            if (segmentOf.length > 0) {
                let uri = segmentOf[0].replace(BACKEND_URL, "")
                return navigate(uri)
            } else {
                return navigate("/")
            }
        } else {
            console.log(response.statusText)
        }
    }

    const selectOf = (s) => {
        let uri = s.replace(BACKEND_URL, "")
        return navigate(uri)
    }

    const selectSegment = (url) => {
        let uri = url.replace("<" + BACKEND_URL, "").replace(">", "")
        return navigate(uri)
    }

    const selectToIntersect = (segment) => {
        if (selectIntersect === segment) {
            setSelectIntersect()
        } else {
            setSelectIntersect(segment)
        }
    }

    const selectToUnion = (segment) => {
        if (selectUnion === segment) {
            setSelectUnion()
        } else {
            setSelectUnion(segment)
        }
    }

    const combineWith = async (operation) => {
        let keyword = operation === "union" ? "or" : "and"
        let options = {
            method: 'POST',
            body: JSON.stringify({
                "s": [operation === "union" ? selectUnion : selectIntersect],
                "p": ["<http://megras.org/schema#segmentType>", "<http://megras.org/schema#segmentDefinition>"],
                "o": []
            })
        }
        let response = await fetch(BACKEND_URL + "/query/quads", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        let data = await response.json()
        let type = ""
        let definition = ""
        data.results.forEach((res) => {
            if (res.p === "<http://megras.org/schema#segmentType>") {
                type = res.o.replace("^^String", "")
            } else if (res.p === "<http://megras.org/schema#segmentDefinition>") {
                definition = res.o.replace("^^String", "")
            }
        })

        let url = segmentOf[segmentOf.length-1] + "/segment/" + segmenttype[0] + "/" + segmentDefinition[0] + "/" + keyword + "/" + type + "/" + definition
        setCombinationLoading(true)
        response = await fetch(url).catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response.ok) {
            setCombinationLoading(false)
            navigate(response.url.replace(BACKEND_URL, ""))
        }
    }

    const details = (
        <>
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
                            {segmenttype.length == 0 &&
                                <TableRow>
                                    <TableCell>Caption</TableCell>
                                    <TableCell>
                                        {captions.length > 0 ?
                                            <Stack direction="column">
                                                {captions.map((c) => (
                                                    <Box>{c}</Box>
                                                ))}
                                            </Stack>
                                            :
                                            <Stack spacing={2} direction="row" justifyContent="center" alignItems="center">
                                                <TextField sx={{ width: '18vw' }} value={tempCaption} onChange={(e) => setTempCaption(e.target.value)} />
                                                {filetype && filetype.startsWith("image") &&
                                                    <>
                                                        {captionLoading ? <CircularProgress /> :
                                                            <IconButton onClick={generateCaption}><AutoAwesomeIcon /></IconButton>
                                                        }
                                                    </>
                                                }
                                                <IconButton variant='contained' color='secondary' disabled={!tempCaption} onClick={sendCaption}><SendIcon /></IconButton>
                                            </Stack>
                                        }
                                    </TableCell>
                                </TableRow>
                            }
                            {segmenttype.length > 0 && <TableRow>
                                <TableCell>Segment Type</TableCell>
                                <TableCell>{segmenttype.join(" + ")}</TableCell>
                            </TableRow>}
                            {segmenttype.length > 0 && <TableRow>
                                <TableCell>Category</TableCell>
                                <TableCell>
                                    {category ?
                                        category :
                                        <Stack spacing={2} direction="row" justifyContent="center" alignItems="center">
                                            <TextField sx={{ width: '8vw' }} onChange={(e) => setTempCategory(e.target.value)} />
                                            <IconButton variant='contained' color='secondary' disabled={!tempCategory} onClick={sendCategory}><SendIcon /></IconButton>
                                        </Stack>
                                    }
                                </TableCell>
                            </TableRow>}
                            {segmentOf.length > 0 && <TableRow>
                                <TableCell style={{ verticalAlign: 'top' }}>Segment of</TableCell>
                                <TableCell>
                                    {segmentOf.map((s) => (
                                        <Box sx={{ cursor: 'pointer' }} onClick={() => selectOf(s)}>
                                            <FileDisplay isPreview filedata={s} filetype={"image"} />
                                        </Box>
                                    ))}
                                </TableCell>
                            </TableRow>}
                            {filetype && !filetype.startsWith("image") && segments.length > 0 && <TableRow>
                                <TableCell style={{ verticalAlign: 'top' }}>Segments</TableCell>
                                <TableCell>
                                    <Stack direction="column">
                                        {segments.map((s) => (
                                            <Box sx={{ cursor: 'pointer' }} onClick={() => selectSegment(s.url)}>
                                                <FileDisplay isPreview filedata={s.url.replace("<", "").replace(">", "")} filetype={"image"} />
                                            </Box>
                                        ))}
                                    </Stack>
                                </TableCell>
                            </TableRow>}
                            {intersectable.length > 0 && <TableRow>
                                <TableCell style={{ verticalAlign: 'top' }}>Intersect with</TableCell>
                                <TableCell>
                                    <Stack direction="column" spacing={1}>
                                        {intersectable.map((s) => (
                                            <Box
                                                sx={{ cursor: 'pointer', border: s === selectIntersect ? '4px solid red' : '4px solid transparent' }}
                                                onClick={() => selectToIntersect(s)}
                                            >
                                                <FileDisplay isPreview filedata={s.replace("<", "").replace(">", "")} filetype={"image"} />
                                            </Box>
                                        ))}
                                        <Button variant='contained' color='secondary' disabled={!selectIntersect} onClick={() => combineWith("intersection")}>Confirm</Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>}
                            {unionable.length > 0 && <TableRow>
                                <TableCell style={{ verticalAlign: 'top' }}>Union with</TableCell>
                                <TableCell>
                                    <Stack direction="column" spacing={1}>
                                        {unionable.map((s) => (
                                            <Box
                                                sx={{ cursor: 'pointer', border: s === selectUnion ? '4px solid red' : '4px solid transparent' }}
                                                onClick={() => selectToUnion(s)}
                                            >
                                                <FileDisplay isPreview filedata={s.replace("<", "").replace(">", "")} filetype={"image"} />
                                            </Box>
                                        ))}
                                        <Button variant='contained' color='secondary' disabled={!selectUnion} onClick={() => combineWith("union")}>Confirm</Button>
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
        </>
    )

    return (
        <>
            <div className='App-title'>
                Media Details
            </div>
            <div className="App-content">
                {combinationLoading ? <CircularProgress /> :
                    <>
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
                    </>
                }
            </div>
        </>
    )
}

export default MediaDetails;