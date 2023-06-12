import React from 'react';
import './App.css';
import ImageUploading from 'react-images-uploading';
import { Box, Button, CircularProgress, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import instances from './instances_val2017.json'
import { useNavigate } from 'react-router';
import FileSelect from './FileSelect';


const CocoImporter = () => {
    const navigate = useNavigate();

    const [images, setImages] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
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

    const handleFileUpload = (images) => {
        const imageList = [...images]
        const imageObjectList = imageList.map(i => ({ "file": i, "data": URL.createObjectURL(i) }))
        setImages(imageObjectList);
        console.log(imageObjectList);
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

        for await (let image of images) {
            var body = new FormData()
            body.append("file", image["file"])
            let filename = image["file"]["name"]
            let imageid = filename.replace("0", "").replace(".jpg", "")

            var response = await fetch("http://localhost:8080/add/file", { method: 'POST', body: body })
            if (response.ok) {
                let data = await response.json()
                console.log(data)
                let imageUrl = "http://localhost:8080/" + data[filename]["uri"]

                for await (let a of instances["annotations"]) {
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
                                console.log(response)
                                c += 1
                                quads.push({
                                    "s": "<" + response.url + ">",
                                    "p": "<https://schema.org/category>",
                                    "o": categories.get(a.category_id) + "^^String"
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
        await fetch("http://localhost:8080/add/quads", options)

        console.log("complete")
        setAddedSegments(c)
        setLoading(false)
    }

    const addMore = () => {
        setImages([])
        setAddedSegments(0)
    }

    return (
        <>
            <div className='App-title'>
                COCO Import
                <div className='App-subtitle'>Import images and segments from the <a href="https://cocodataset.org/" target="_blank">COCO</a> dataset.</div>
            </div>
            <div className="App-content">
                {loading ? <CircularProgress /> :
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
                                maxWidth={'60vw'}
                                justifyContent='center'
                                alignItems='flex-end'
                                spacing={10}
                            >
                                {images.map((img, i) => {
                                    let cols = images.length < 6 ? 12 / (images.length + 1) : 2
                                    return (
                                        <Grid item key={i} xs={cols}>
                                            <Paper onClick={() => removeImage(i)} sx={{ height: '16vh', cursor: 'pointer' }}>
                                                <img
                                                    src={img['data']}
                                                    key={i}
                                                    alt=""
                                                    height='80%'
                                                    width='100%'
                                                    style={{ objectFit: 'scale-down' }}
                                                />
                                                <Typography>{img.file.name}</Typography>
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