import React from 'react';
import './App.css';
import { Box, Button, CircularProgress, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import instances from './instances_val2017.json'
import captions from './captions_val2017.json'
import { useNavigate } from 'react-router';
import FileSelect from './FileSelect';
import { BACKEND_ERR, PREDICTOR_ERR } from './Errors';
import { BACKEND_URL, PREDICTOR_URL } from './Api';


const CocoImporter = ({ triggerSnackbar }) => {
    const navigate = useNavigate();

    const [images, setImages] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [addedSegments, setAddedSegments] = React.useState(0);

    const categories = new Map(
        instances.categories.map(c => {
            return [c.id, c.name];
        }),
    );

    const heights = new Map(
        instances.images.map(c => {
            return [c.id, c.height];
        }),
    );

    const imageCaptions = new Map()
    captions.annotations.forEach(a => {
        if (!imageCaptions.has(a.image_id)) {
            imageCaptions.set(a.image_id, [])
        }
        imageCaptions.get(a.image_id).push(a.caption)
    })


    const handleFileUpload = (images) => {
        const imageList = [...images]
        const imageObjectList = imageList.map(i => ({ "file": i, "data": URL.createObjectURL(i) }))
        setImages(imageObjectList);
    };

    const removeImage = (idx) => {
        const temp = [...images];
        temp.splice(idx, 1);
        setImages(temp);
    }

    const confirm = async () => {
        var c = 0
        let quads = []
        setLoading(true)
        var current = 0

        for await (let image of images) {
            current += 1
            setProgress(current / images.length * 100)

            var body = new FormData()
            body.append("file", image["file"])
            let filename = image["file"]["name"]
            console.log(filename)
            let imageid = filename.replace(".jpg", "")

            var response = await fetch(BACKEND_URL + "/add/file", { method: 'POST', body: body })
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            if (response.ok) {
                let data = await response.json()
                let imageUrl = BACKEND_URL + "/" + data[filename]["uri"]

                let captions = imageCaptions.get(Number(imageid))
                if (captions == undefined) {
                    continue
                }
                for (let caption of captions) {
                    quads.push({
                        "s": "<" + imageUrl + ">",
                        "p": "<https://schema.org/caption>",
                        "o": caption + "^^String"
                    })

                    let embed_response = await fetch(PREDICTOR_URL + "/embedding/" + caption)
                        .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
                    if (embed_response == undefined) return
                    let embedding = await embed_response.text()
                    quads.push({
                        "s": "<" + imageUrl + ">",
                        "p": "<http://megras.org/schema#captionVector>",
                        "o": embedding.trim()
                    })
                }

                for await (let a of instances.annotations) {
                    if (a.image_id == imageid) {
                        if (a.segmentation.length === 1) {
                            const height = heights.get(a.image_id)
                            const correctedpoints = a.segmentation[0].map((p, i) => {
                                if (i % 2 == 0) { return p }
                                else { return height - p }
                            })
                            const segmenturl = imageUrl + "/segment/polygon/" + correctedpoints.join(",")

                            response = await fetch(segmenturl)
                            if (response.ok) {
                                c += 1
                                let category = categories.get(a.category_id)
                                quads.push({
                                    "s": "<" + response.url + ">",
                                    "p": "<https://schema.org/category>",
                                    "o": category + "^^String"
                                })

                                let embed_response = await fetch(PREDICTOR_URL + "/embedding/" + category)
                                    .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
                                if (embed_response == undefined) return
                                let embedding = await embed_response.text()
                                quads.push({
                                    "s": "<" + response.url + ">",
                                    "p": "<http://megras.org/schema#categoryVector>",
                                    "o": embedding.trim()
                                })
                            }
                        }
                    }
                }
            }
        }

        var options = {
            method: 'POST',
            body: JSON.stringify({
                "quads": quads
            })
        }
        await fetch(BACKEND_URL + "/add/quads", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))

        console.log("complete")
        setAddedSegments(c)
        setLoading(false)
    }

    const addMore = () => {
        setImages([])
        setAddedSegments(0)
        setLoading(false)
        setProgress(0)
    }

    return (
        <>
            <div className='App-title'>
                COCO Import
                <div className='App-subtitle'>Import images and segments from the <a href="https://cocodataset.org/" target="_blank">COCO</a> dataset.</div>
            </div>
            <div className="App-content">
                {loading ? <CircularProgress variant='determinate' value={progress} /> :
                    <>
                        {addedSegments == 0 &&
                            <FileSelect
                                handleFileUpload={handleFileUpload}
                                multiple={true}
                                accept='image/*'
                            />
                        }
                        <br />
                        {addedSegments == 0 &&
                            <Grid
                                container
                                maxWidth={'50vw'}
                                justifyContent='center'
                                alignItems='flex-end'
                                spacing={2}
                            >
                                {images.map((img, i) => {
                                    let cols = images.length < 6 ? 12 / (images.length + 1) : 3
                                    return (
                                        <Grid item key={i} xs={cols}>
                                            <Paper sx={{ height: '16vh' }}>
                                                <Stack direction="column" height="100%" alignItems="center" p={0.5}>

                                                <img
                                                    src={img['data']}
                                                    key={i}
                                                    alt=""
                                                    height='80%'
                                                    width='100%'
                                                    style={{ objectFit: 'scale-down' }}
                                                />
                                                <Stack direction="row" alignItems="center">
                                                <Typography>{img.file.name}</Typography>
                                                    <IconButton onClick={() => removeImage(i)}><DeleteIcon /></IconButton>
                                                </Stack>
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        }
                        <br />
                        {addedSegments == 0 && images.length > 0 &&
                            <Stack spacing={2} direction="row" justifyContent="center">
                                <Button variant='contained' onClick={() => setImages([])} startIcon={<DeleteIcon />}>Remove all</Button>
                                <Button variant='contained' color='secondary' onClick={() => confirm()} startIcon={<CheckBoxIcon />}>Confirm Selection</Button>
                            </Stack>
                        }
                        {addedSegments > 0 &&
                            <Stack spacing={2} direction="column">
                                <Box>Successfully added {images.length} image(s) with {addedSegments} segment(s) total</Box>
                                <Stack spacing={2} direction="row" justifyContent="center">
                                    <Button variant='contained' onClick={() => navigate("/")}>See in Library</Button>
                                    <Button variant='contained' onClick={addMore}>Add more</Button>
                                </Stack>
                            </Stack>
                        }
                    </>
                }
            </div>
        </>
    )
}

export default CocoImporter;