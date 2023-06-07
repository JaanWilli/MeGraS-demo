import { editor } from '@overlapmedia/imagemapper';
import React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Input, TextField } from '@mui/material';
import { UPNG } from './UPNG';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import PentagonIcon from '@mui/icons-material/Pentagon';
import RectangleIcon from '@mui/icons-material/Rectangle';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckBoxIcon from '@mui/icons-material/CheckBox';


function ImageAnnotator({ image }) {
    const elementRef = React.useRef(null);
    const canvas = React.createRef();

    const [myEditor, setMyEditor] = React.useState();
    const [shape, setShape] = React.useState();
    const [mode, setMode] = React.useState("select");
    const [freehand, setFreehand] = React.useState(false);
    const [brushRadius, setBrushRadius] = React.useState(20);

    const [width, setWidth] = React.useState(0);
    const [height, setHeight] = React.useState(0);

    React.useEffect(() => {
        if (elementRef.current) {
            const myEditor = editor(elementRef.current, {
                componentDrawnHandler: (d) => {
                    setShape(d)
                    setMode("select")
                    myEditor.selectMode()
                    console.log(d)
                }
            });
            setMyEditor(myEditor);
            myEditor.loadImage(image);
            myEditor.on('mouseup', (e) => console.log('mouseup event', e));
            myEditor.selectMode();

            getImageSize()
        }
    }, [freehand]);

    const getImageSize = () => {
        const img = new Image();
        img.onload = function () {
            setWidth(this.width)
            setHeight(this.height)
        }
        img.src = image;
    }

    const toFreehand = (isFreehand) => {
        if (isFreehand) {
            clearShape()
        }
        setFreehand(isFreehand)
    }

    function select() {
        myEditor.selectMode()
        setMode("select")
    }

    const draw = (type) => {
        if (type === "rectangle") {
            myEditor.rect()
        } else if (type === "polygon") {
            myEditor.polygon()
        }
        setMode(type)
    }

    const clearShape = () => {
        if (shape !== undefined) {
            const x = myEditor.getComponentById(shape.element.id)
            if (x !== undefined) {
                myEditor.removeComponent(x)
                setShape();
            }
        }
    }

    const confirmShape = () => {
        var url;
        if (shape.dim !== undefined) {
            console.log(shape.dim)
            const x = shape.dim.x
            const w = shape.dim.width
            const h = shape.dim.height
            const y = height - shape.dim.y - h
            url = image + "/segment/rect/" + x + "," + (x + w) + "," + y + "," + (y + h)
        } else if (shape.points !== undefined) {
            console.log(shape.points)
            var points = []
            for (var i = 0; i < shape.points.length; i++) {
                points.push("(" + shape.points[i].x + "," + (height - shape.points[i].y) + ")")
            }
            url = image + "/segment/polygon/" + points.join(",")
        }
        console.log(url)

        fetch(url)
            .then(response => window.open(response.url, "_blank"))
            .catch(e => console.log(e))
    }

    const confirmFreehand = async () => {
        let base64rgba = await canvas.current.exportImage("png")
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

        let url = image + "/segment/mask/" + base64binary
        console.log(url)

        fetch(url)
            .then(response => window.open(response.url, "_blank"))
            .catch(e => console.log(e))
    }

    return (
        <>
            <Stack spacing={2} direction="row" marginBottom={2}>
                <Button variant={freehand ? "text" : "contained"} onClick={() => toFreehand(false)}>Shapes</Button>
                <Button variant={freehand ? "contained" : "text"} onClick={() => toFreehand(true)}>Freehand</Button>
            </Stack>
            {freehand ?
                <Stack spacing={2} direction="row">
                    <Stack spacing={2} direction="column">
                        <TextField size='small' style={{ width: '60px', backgroundColor: 'white' }} value={brushRadius} onChange={b => setBrushRadius(b.target.value)}>brush</TextField>
                        <Button onClick={() => canvas.current.clearCanvas()}><DeleteIcon /></Button>
                        <Button variant="contained" onClick={() => confirmFreehand()}><CheckBoxIcon /></Button>
                    </Stack>
                    <ReactSketchCanvas
                        ref={canvas}
                        width={width}
                        height={height}
                        strokeColor='white'
                        backgroundImage={image}
                        strokeWidth={brushRadius}
                    />
                </Stack>
                :
                <Stack spacing={2} direction="row">
                    <Stack spacing={2} direction="column">
                        <Button variant={mode === "select" ? "contained" : "text"} onClick={() => select()}><HighlightAltIcon /></Button>
                        <Button variant={mode === "polygon" ? "contained" : "text"} disabled={shape !== undefined} onClick={() => draw("polygon")}><PentagonIcon /></Button>
                        <Button variant={mode === "rectangle" ? "contained" : "text"} disabled={shape !== undefined} onClick={() => draw("rectangle")}><RectangleIcon /></Button>
                        <Button onClick={() => clearShape()}><DeleteIcon /></Button>
                        <Button variant="contained" onClick={() => confirmShape()}><CheckBoxIcon /></Button>
                    </Stack>
                    <svg
                        ref={elementRef}
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        width={width}
                        height={height}
                        viewBox={`0, 0, ${width}, ${height}`}
                        preserveAspectRatio="xMinYMin"
                    />
                </Stack>}
        </>
    );
}

export default ImageAnnotator;