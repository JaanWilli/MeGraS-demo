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

import { BACKEND_ERR, PREDICTOR_ERR } from './Errors';
import { BACKEND_URL, PREDICTOR_URL } from './Api';
import { useNavigate } from 'react-router';


function ImageAnnotator({ triggerSnackbar, id }) {
    const imageUrl = BACKEND_URL + "/" + id

    const navigate = useNavigate();

    const elementRef = React.useRef(null);
    const canvas = React.createRef(null);

    const [myEditor, setMyEditor] = React.useState();
    const [shape, setShape] = React.useState();
    const [shapeType, setShapeType] = React.useState("select");
    const [mode, setMode] = React.useState("shape");
    const [brushRadius, setBrushRadius] = React.useState(20);
    const [prompt, setPrompt] = React.useState();
    const [mask, setMask] = React.useState();
    const [predictLoading, setPredictLoading] = React.useState();
    const [loading, setLoading] = React.useState();

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
        setPredictLoading(true)
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
        let response = await fetch(PREDICTOR_URL + "/predict", options)
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (response == undefined) return
        let base64mask = await response.text()
        setMask(base64mask)
        setPredictLoading(false)
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
        segment(url)
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
        segment(url)
    }

    const segment = async (url) => {
        console.log(url)
        setLoading(true)
        let response = await fetch(url).catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response.ok) {
            setLoading(false)
            navigate(response.url.replace(BACKEND_URL, ""))
        }
    }

    return (
        <>
            <div className='App-title'>
                Image Annotation
                <div className='App-subtitle'>Define new segments of an image.</div>
            </div>
            <div className="App-content">
                {loading ? <CircularProgress /> :
                    <>
                        <Stack spacing={2} direction="row" marginBottom={2}>
                            <Button variant={mode === "shape" ? "contained" : "text"} onClick={() => changeMode("shape")}>Shapes</Button>
                            <Button variant={mode === "freehand" ? "contained" : "text"} onClick={() => changeMode("freehand")}>Freehand</Button>
                            <Button variant={mode === "predict" ? "contained" : "text"} onClick={() => changeMode("predict")}>Predict</Button>
                        </Stack>
                        {mode === "freehand" &&
                            <Stack spacing={2} direction="row">
                                <Stack spacing={2} direction="column" justifyContent="space-between">
                                    <Stack spacing={2}>
                                        <TextField size='small' style={{ width: '60px', backgroundColor: 'white' }} value={brushRadius} onChange={b => setBrushRadius(b.target.value)}>brush</TextField>
                                        <Button onClick={() => canvas.current.undo()}><UndoIcon /></Button>
                                        <Button onClick={clear}><DeleteIcon /></Button>
                                    </Stack>
                                    <Button variant="contained" color='secondary' onClick={() => confirmMask()}><CheckBoxIcon /></Button>
                                </Stack>
                                <Stack spacing={2} direction="column">
                                    <ReactSketchCanvas
                                        ref={canvas}
                                        style={{ position: 'relative', background: `url(${imageUrl})` }}
                                        width={width}
                                        height={height}
                                        strokeColor='white'
                                        backgroundImage={'none'} // see https://github.com/vinothpandian/react-sketch-canvas/issues/58
                                        strokeWidth={brushRadius}
                                    />
                                </Stack>
                            </Stack>
                        }
                        {mode === "shape" &&
                            <Stack spacing={2} direction="row">
                                <Stack spacing={2} direction="column" justifyContent="space-between">
                                    <Stack spacing={2}>
                                        <Button variant={shapeType === "select" ? "contained" : "text"} onClick={() => select()}><HighlightAltIcon /></Button>
                                        <Button variant={shapeType === "polygon" ? "contained" : "text"} disabled={shape !== undefined} onClick={() => draw("polygon")}><PentagonIcon /></Button>
                                        <Button variant={shapeType === "rectangle" ? "contained" : "text"} disabled={shape !== undefined} onClick={() => draw("rectangle")}><RectangleIcon /></Button>
                                        <Button onClick={clear}><DeleteIcon /></Button>
                                    </Stack>
                                    <Button variant="contained" color='secondary' disabled={!shape} onClick={() => confirmShape()}><CheckBoxIcon /></Button>
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
                                </Stack>
                            </Stack>
                        }
                        {mode === "predict" &&
                            <Stack spacing={2} direction="row">
                                <Stack spacing={2} direction="column" justifyContent="space-between">
                                    <Stack spacing={2}>
                                        <TextField label="Prompt" onChange={(e) => setPrompt(e.target.value.toLowerCase())} />
                                        <Button onClick={predict}>{predictLoading ? <CircularProgress /> : <SearchIcon />}</Button>
                                        <Button disabled={!mask} onClick={clear}><DeleteIcon /></Button>
                                    </Stack>
                                    <Button color='secondary' disabled={!mask} onClick={() => confirmMask()}><CheckBoxIcon /></Button>
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
                                </Stack>
                            </Stack>
                        }
                    </>
                }
            </div>
        </>
    );
}

export default ImageAnnotator;