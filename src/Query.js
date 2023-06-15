import { Autocomplete, Box, CircularProgress, Grid, IconButton, Paper, Stack, TextField } from '@mui/material';
import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ImageSegmentDetails from './ImageSegmentDetails';
import { useNavigate } from 'react-router';


const Query = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(false);
    const [segmentQuery, setSegmentQuery] = React.useState()
    const [imageQuery, setImageQuery] = React.useState()

    const [segments, setSegments] = React.useState([])
    const [images, setImages] = React.useState([])

    const search = async () => {
        setLoading(true)
        let updateImages = []
        let updateSegments = []
        if (imageQuery) {
            updateImages = await searchImages()
        }
        if (segmentQuery) {
            updateSegments = await searchSegments()
            if (updateImages.length == 0) {
                let images = await findImagesForSegments(updateSegments)
                updateImages = [...new Set(images)]
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
        let response = await fetch("http://localhost:8080/query/quads", options)
        let data = await response.json()
        return data.results.map(r => r.o)
    }

    const searchSegments = async () => {
        let seg_embed = await fetch("http://localhost:5000/embedding/" + segmentQuery)
        let embedding = await seg_embed.text()
        let vector = embedding.slice(1, embedding.length - 2).split(",").map(v => Number(v))

        var options = {
            method: 'POST',
            body: JSON.stringify({
                "predicate": "<http://megras.org/schema#categoryVector>",
                "object": vector,
                "count": 1,
                "distance": "COSINE"
            })
        }
        let response = await fetch("http://localhost:8080/query/knn", options)
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

    const searchImages = async () => {
        let seg_embed = await fetch("http://localhost:5000/embedding/" + imageQuery)
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
        let response = await fetch("http://localhost:8080/query/knn", options)
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
                            <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(s.replace("<http://localhost:8080", "").replace(">", ""))}>
                                <ImageSegmentDetails
                                    objectId={s.replace("<http://localhost:8080/", "").replace(">", "")}
                                    setLoading={() => { }}
                                    limitSegments={segments}
                                    hideEmpty={segments.length > 0}
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