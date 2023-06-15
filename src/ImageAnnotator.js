import { editor } from '@overlapmedia/imagemapper';
import React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { ReactSketchCanvas } from "react-sketch-canvas";
import { CircularProgress, TextField } from '@mui/material';
import { UPNG } from './UPNG';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import PentagonIcon from '@mui/icons-material/Pentagon';
import RectangleIcon from '@mui/icons-material/Rectangle';
import UndoIcon from '@mui/icons-material/Undo';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import SearchIcon from '@mui/icons-material/Search';

import ImageDialog from './ImageDialog';


function ImageAnnotator({ id }) {
    const imageUrl = "http://localhost:8080/" + id

    const elementRef = React.useRef(null);
    const canvas = React.createRef(null);

    const [myEditor, setMyEditor] = React.useState();
    const [shape, setShape] = React.useState();
    const [shapeType, setShapeType] = React.useState("select");
    const [mode, setMode] = React.useState("shape");
    const [brushRadius, setBrushRadius] = React.useState(20);
    const [prompt, setPrompt] = React.useState();
    const [mask, setMask] = React.useState();
    const [loading, setLoading] = React.useState();
    const [category, setCategory] = React.useState();

    const [open, setOpen] = React.useState(false);
    const [url, setUrl] = React.useState();

    const [width, setWidth] = React.useState();
    const [height, setHeight] = React.useState();

    const img = new Image();
    img.onload = function () {
        setWidth(this.width)
        setHeight(this.height)
    }
    img.src = imageUrl;

    React.useEffect(() => {
        if (elementRef.current) {
            const myEditor = editor(elementRef.current, {
                componentDrawnHandler: (d) => {
                    setShape(d)
                    setShapeType("select")
                    myEditor.selectMode()
                    console.log(d)
                }
            });
            setMyEditor(myEditor);
            myEditor.loadImage(imageUrl);
            myEditor.selectMode();
        }
    }, [mode]);

    const changeMode = (mode) => {
        clear()
        setMode(mode)
    }

    function select() {
        myEditor.selectMode()
        setShapeType("select")
    }

    const draw = (type) => {
        if (type === "rectangle") {
            myEditor.rect()
        } else if (type === "polygon") {
            myEditor.polygon()
        }
        setShapeType(type)
    }

    const clear = () => {
        if (mode === "freehand") {
            canvas.current.clearCanvas()
        } else if (mode === "shape") {
            if (shape !== undefined) {
                const x = myEditor.getComponentById(shape.element.id)
                if (x !== undefined) {
                    myEditor.removeComponent(x)
                    setShape();
                }
            }
        } else {
            setMask()
        }
    }

    const predict = async () => {
        setLoading(true)
        var options = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "url": imageUrl,
                "prompt": prompt
            })
        }
        let response = await fetch("http://localhost:5000/predict", options)
        let base64mask = await response.text()
        setMask(base64mask)
        setLoading(false)
    }

    const confirmShape = () => {
        var url;
        if (shape.dim !== undefined) {
            const x = shape.dim.x
            const w = shape.dim.width
            const h = shape.dim.height
            const y = height - shape.dim.y - h
            url = imageUrl + "/segment/rect/" + x + "," + (x + w) + "," + y + "," + (y + h)
        } else if (shape.points !== undefined) {
            var points = []
            for (var i = 0; i < shape.points.length; i++) {
                points.push("(" + shape.points[i].x + "," + (height - shape.points[i].y) + ")")
            }
            url = imageUrl + "/segment/polygon/" + points.join(",")
        }
        console.log(url)

        setOpen(true)
        setUrl(url)
        clear()
    }

    const confirmMask = async () => {
        let base64rgba
        if (mode === "freehand") {
            base64rgba = await canvas.current.exportImage("png")
        } else if (mode === "predict") {
            base64rgba = mask
        }
        let response = await fetch(base64rgba)
        let arraybuffer = await response.arrayBuffer()

        const rgba = UPNG.toRGBA8(UPNG.decode(arraybuffer));
        let binary = UPNG.encode(rgba, width, height, 2)

        let base64binaryfull = await new Promise((r) => {
            const reader = new FileReader()
            reader.onload = () => r(reader.result)
            reader.readAsDataURL(new Blob([binary]))
        })
        let base64binary = base64binaryfull.substring(base64binaryfull.indexOf(',') + 1).replace(/\+/g, '-').replace(/\//g, '_')

        let url = imageUrl + "/segment/mask/" + base64binary
        console.log(url)

        setOpen(true)
        setUrl(url)
        clear()
    }

    return (
        <>
            <div className='App-title'>
                Image Annotation
                <div className='App-subtitle'>Define new segments of an image.</div>
            </div>
            <div className="App-content">
                <Stack spacing={2} direction="row" marginBottom={2}>
                    <Button variant={mode === "shape" ? "contained" : "text"} onClick={() => changeMode("shape")}>Shapes</Button>
                    <Button variant={mode === "freehand" ? "contained" : "text"} onClick={() => changeMode("freehand")}>Freehand</Button>
                    <Button variant={mode === "predict" ? "contained" : "text"} onClick={() => changeMode("predict")}>Predict</Button>
                </Stack>
                {mode === "freehand" &&
                    <Stack spacing={2} direction="row">
                        <Stack spacing={2} direction="column">
                            <TextField size='small' style={{ width: '60px', backgroundColor: 'white' }} value={brushRadius} onChange={b => setBrushRadius(b.target.value)}>brush</TextField>
                            <Button onClick={() => canvas.current.undo()}><UndoIcon /></Button>
                            <Button onClick={clear}><DeleteIcon /></Button>
                        </Stack>
                        <Stack spacing={2} direction="column">
                            <ReactSketchCanvas
                                ref={canvas}
                                style={{ position: 'relative' }}
                                width={width}
                                height={height}
                                strokeColor='white'
                                backgroundImage={imageUrl}
                                strokeWidth={brushRadius}
                            />
                            <Stack spacing={2} direction="row" justifyContent="center">
                                <TextField required label="Category" onChange={(e) => setCategory(e.target.value.toLowerCase())} />
                                <Button variant="contained" color='secondary' disabled={!category} onClick={() => confirmMask()}><CheckBoxIcon /></Button>
                            </Stack>
                        </Stack>
                    </Stack>
                }
                {mode === "shape" &&
                    <Stack spacing={2} direction="row">
                        <Stack spacing={2} direction="column">
                            <Button variant={shapeType === "select" ? "contained" : "text"} onClick={() => select()}><HighlightAltIcon /></Button>
                            <Button variant={shapeType === "polygon" ? "contained" : "text"} disabled={shape !== undefined} onClick={() => draw("polygon")}><PentagonIcon /></Button>
                            <Button variant={shapeType === "rectangle" ? "contained" : "text"} disabled={shape !== undefined} onClick={() => draw("rectangle")}><RectangleIcon /></Button>
                            <Button onClick={clear}><DeleteIcon /></Button>
                        </Stack>
                        <Stack spacing={2} direction="column">
                            <svg
                                ref={elementRef}
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                width={width}
                                height={height}
                                viewBox={`0, 0, ${width}, ${height}`}
                                preserveAspectRatio="xMinYMin"
                            />
                            <Stack spacing={2} direction="row" justifyContent="center">
                                <TextField required label="Category" onChange={(e) => setCategory(e.target.value.toLowerCase())} />
                                <Button variant="contained" color='secondary' disabled={!shape || !category} onClick={() => confirmShape()}><CheckBoxIcon /></Button>
                            </Stack>
                        </Stack>
                    </Stack>
                }
                {mode === "predict" &&
                    <Stack spacing={2} direction="row">
                        <Stack spacing={2} direction="column">
                            <TextField label="Prompt" onChange={(e) => setPrompt(e.target.value.toLowerCase())} />
                            <Button onClick={predict}>{loading ? <CircularProgress /> : <SearchIcon />}</Button>
                            <Button disabled={!mask} onClick={clear}><DeleteIcon /></Button>
                        </Stack>
                        <Stack spacing={2} direction="column">
                            <img
                                src={imageUrl}
                                alt=""
                                style={{
                                    maskImage: mask ? `url('${mask}')` : null, 
                                    WebkitMaskImage: mask ? `url('${mask}')` : null,
                                }}
                            ></img>
                            <Stack spacing={2} direction="row" justifyContent="center">
                                <TextField required label="Category" onChange={(e) => setCategory(e.target.value.toLowerCase())} />
                                <Button variant="contained" color='secondary' disabled={!mask || !category} onClick={() => confirmMask()}><CheckBoxIcon /></Button>
                            </Stack>
                        </Stack>
                    </Stack>
                }
                <ImageDialog
                    url={url}
                    open={open}
                    category={category}
                    onClose={() => setOpen(false)}
                />
            </div>
        </>
    );
}

export default ImageAnnotator;