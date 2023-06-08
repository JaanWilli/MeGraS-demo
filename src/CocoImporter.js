import React from 'react';
import './App.css';
import ImageUploading from 'react-images-uploading';
import { Box, Button, Grid, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import instances from './instances_val2017.json'
import { useNavigate } from 'react-router';


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

    const onChange = (imageList, addUpdateIndex) => {
        setImages(imageList);
        console.log(imageList)
    };

    const confirm = async () => {
        var c = 0
        for await (let image of images) {
            var body = new FormData()
            body.append("file", image["file"])
            let filename = image["file"]["name"]
            let imageid = filename.replace("0", "").replace(".jpg", "")

            let response = await fetch("http://localhost:8080/add/file", { method: 'POST', body: body })
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

                            let response2 = await fetch(segmenturl)
                            if (response2.ok) {
                                console.log(response2)
                                c += 1
                            }
                        }
                    }
                }
            }
        }
        console.log("complete")
        setAddedSegments(c)
    }

    return (
        <>
            <div className='App-title'>
                COCO Import
                <div className='App-subtitle'>Import images and segments from the <a href="https://cocodataset.org/" target="_blank">COCO</a> dataset.</div>
            </div>
            <div className="App-content">
                {addedSegments == 0 ?
                    <ImageUploading
                        onChange={onChange}
                        multiple
                        value={images}
                        maxNumber={100}
                        dataURLKey="data_url"
                    >
                        {({
                            imageList,
                            onImageUpload,
                            onImageRemoveAll,
                            onImageRemove,
                            isDragging,
                            dragProps,
                        }) => (
                            <div>
                                {imageList.length > 0 && <Box mb={2}>Click image to remove</Box>}
                                <Grid
                                    container
                                    maxWidth={'60vw'}
                                    justifyContent='center'
                                    alignItems='flex-end'
                                    spacing={10}
                                >
                                    {imageList.map((img, i) => {
                                        let cols = imageList.length < 6 ? 12 / (imageList.length + 1) : 2
                                        return (
                                            <Grid item key={i} xs={cols}>
                                                <Stack spacing={2} direction="column">
                                                    <img src={img['data_url']} alt="" width='150vw' onClick={() => onImageRemove(i)} style={{ cursor: 'pointer' }} />
                                                    <Typography>{img.file.name}</Typography>
                                                </Stack>
                                            </Grid>
                                        )
                                    })}
                                </Grid>
                                <br />
                                {imageList.length > 0 &&
                                    <Stack spacing={2} direction="row" justifyContent="center">
                                        <Button variant='contained' onClick={() => onImageRemoveAll()} startIcon={<DeleteIcon />}>Remove all</Button>
                                        <Button variant='contained' color='secondary' onClick={() => confirm()} startIcon={<CheckBoxIcon />}>Confirm Selection</Button>
                                    </Stack>
                                }
                                <br />
                                <Button
                                    variant='contained'
                                    style={isDragging ? { color: 'red' } : { color: 'white' }}
                                    onClick={onImageUpload}
                                    startIcon={<AddIcon />}
                                    {...dragProps}
                                >
                                    Upload COCO Images
                                </Button>
                            </div>
                        )}
                    </ImageUploading> :
                    <Stack spacing={2} direction="column">
                        <Box>Successfully added {images.length} image(s) with {addedSegments} segment(s) total</Box>
                        <Stack spacing={2} direction="row" justifyContent="center">
                            <Button variant='contained' onClick={() => navigate("/")}>See in Library</Button>
                            <Button variant='contained' onClick={() => setAddedSegments(0)}>Add more</Button>
                        </Stack>
                    </Stack>
                }
            </div>
        </>
    )
}

export default CocoImporter;