import { Box, CircularProgress, IconButton, Stack, TextField } from '@mui/material';
import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ImageSegmentDetails from './ImageSegmentDetails';
import { useNavigate } from 'react-router';
import { BACKEND_ERR, PREDICTOR_ERR } from './Errors';
import { BACKEND_URL, PREDICTOR_URL } from './Api';


const Query = ({ triggerSnackbar }) => {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(false);
    const [segmentQuery, setSegmentQuery] = React.useState()
    const [imageQuery, setImageQuery] = React.useState()

    const [segments, setSegments] = React.useState([])
    const [images, setImages] = React.useState([])
    const [searchFor, setSearchFor] = React.useState()

    const search = async () => {
        setLoading(true)
        let updateImages = []
        let updateSegments = []
        if (imageQuery) {
            setSearchFor("image")
            updateImages = await searchImages()
        }
        if (segmentQuery) {
            setSearchFor("segment")
            updateSegments = await searchSegments()
            if (updateImages.length == 0) {
                let images = await findImagesForSegments(updateSegments)
                updateImages = [...new Set(images)]
            } else {
                setSearchFor("both")
            }
        }
        console.log(updateImages.length, updateSegments.length)
        setImages(updateImages)
        setSegments(updateSegments)
        setLoading(false)
    }

    const findImagesForSegments = async (segments) => {
        let options = {
            method: 'POST',
            body: JSON.stringify({
                "s": segments,
                "p": ["<http://megras.org/schema#segmentOf>"],
                "o": []
            })
        }
        let response = await fetch(BACKEND_URL + "/query/quads", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        let data = await response.json()
        return data.results.map(r => r.o)
    }

    const searchSegments = async () => {
        let query = `SELECT DISTINCT ?cLabel WHERE{  ?item ?label "${segmentQuery}"@en. ?c wdt:P279 / wdt:P279? ?item . SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`
        let res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + query)
        let wd_json = await res.json()

        let children = wd_json.results.bindings.map(b => b.cLabel.value)
        let options = {
            method: 'POST',
            body: JSON.stringify({
                "s": [],
                "p": ["<https://schema.org/category>"],
                "o": children
            })
        }
        let response = await fetch(BACKEND_URL + "/query/quads", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        let data = await response.json()

        if (data.results.length == 0) {
            console.log("no direct results found, starting semantic search")
            let seg_embed = await fetch(PREDICTOR_URL + "/embedding/" + segmentQuery)
                .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
            if (seg_embed == undefined) return
            let embedding = await seg_embed.text()
            let vector = embedding.slice(1, embedding.length - 2).split(",").map(v => Number(v))

            options = {
                method: 'POST',
                body: JSON.stringify({
                    "predicate": "<http://megras.org/schema#categoryVector>",
                    "object": vector,
                    "count": 3,
                    "distance": "COSINE"
                })
            }
            response = await fetch(BACKEND_URL + "/query/knn", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            data = await response.json()
        }

        let urls = new Set()
        data.results.forEach(r => {
            if (r.s.startsWith("<")) {
                urls.add(r.s)
            }
        })
        return Array.from(urls)
    }

    const searchImages = async () => {
        let seg_embed = await fetch(PREDICTOR_URL + "/embedding/" + imageQuery)
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (seg_embed == undefined) return
        let image_embedding = await seg_embed.text()
        let vector = image_embedding.slice(1, image_embedding.length - 2).split(",").map(v => Number(v))

        var options = {
            method: 'POST',
            body: JSON.stringify({
                "predicate": "<http://megras.org/schema#captionVector>",
                "object": vector,
                "count": 3,
                "distance": "COSINE"
            })
        }
        let response = await fetch(BACKEND_URL + "/query/knn", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        console.log(response)
        let data = await response.json()
        console.log(data)

        let urls = new Set()
        data.results.forEach(r => {
            if (r.s.startsWith("<")) {
                urls.add(r.s)
            }
        })

        return Array.from(urls)
    }

    return (
        <>
            <div className='App-title'>
                Query Segments
            </div>
            <div className="App-content-header">
                <Stack spacing={2} direction="row">
                    <TextField
                        label="Segment Category"
                        onChange={(e) => setSegmentQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" ? search() : null}
                    />
                    <TextField
                        label="Image Description"
                        onChange={(e) => setImageQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" ? search() : null}
                    />
                    <IconButton onClick={search}><SearchIcon /></IconButton>
                </Stack>
            </div>
            <div className="App-content-body">
                {loading ? <CircularProgress /> :
                    <Stack spacing={2} direction="column" alignItems="center">
                        {images.map(s => (
                            <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(s.replace("<" + BACKEND_URL, "").replace(">", ""))}>
                                <ImageSegmentDetails
                                    triggerSnackbar={triggerSnackbar}
                                    objectId={s.replace("<" + BACKEND_URL + "/", "").replace(">", "")}
                                    setLoading={() => { }}
                                    limitSegments={segments}
                                    hideEmpty={segments.length > 0}
                                    transparent={searchFor == "segment"}
                                />
                            </Box>
                        ))
                        }

                    </Stack>
                }
            </div>
        </>
    )
}

export default Query;