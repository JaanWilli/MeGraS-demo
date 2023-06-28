import { Box, Button, Grid, IconButton, Paper, Stack, TextField, Tooltip } from '@mui/material';
import React from 'react';
import { Image, Layer, Rect, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { BACKEND_ERR } from './Errors';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import BackspaceIcon from '@mui/icons-material/Backspace';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';


// for details, see https://konvajs.org/docs/react/Transformer.html
const ImageElement = ({ shapeProps, url, isSelected, width, height, onSelect, onChange }) => {
    const shapeRef = React.useRef();
    const trRef = React.useRef();

    const [image] = useImage(url, 'Anonymous');

    React.useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            {image &&
                <>
                    <Image
                        image={image}
                        x={width / 2 - (image.width / 2)}
                        y={height / 2 - (image.height / 2)}
                        onClick={onSelect}
                        onTap={onSelect}
                        ref={shapeRef}
                        {...shapeProps}
                        style={{ cursor: 'pointer' }}
                        draggable
                        onDragEnd={(e) => {
                            onChange({
                                ...shapeProps,
                                x: e.target.x(),
                                y: e.target.y(),
                            });
                        }}
                        onTransformEnd={(e) => {
                            const node = shapeRef.current;
                            const scaleX = node.scaleX();
                            const scaleY = node.scaleY();

                            node.scaleX(1);
                            node.scaleY(1);
                            onChange({
                                ...shapeProps,
                                x: node.x(),
                                y: node.y(),
                                width: Math.max(5, node.width() * scaleX),
                                height: Math.max(node.height() * scaleY),
                            });
                        }}
                    />
                    {isSelected && (
                        <Transformer
                            ref={trRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                        />
                    )}
                </>
            }
        </>
    );
};

const CollageEditor = ({ triggerSnackbar }) => {

    const [width, setWidth] = React.useState()
    const [height, setHeight] = React.useState()
    const [hasCanvas, setHasCanvas] = React.useState(false)

    const [allImages, setImages] = React.useState([])
    const [allSegments, setSegments] = React.useState([])

    React.useEffect(() => {
        async function fetchMedia() {
            let options = {
                method: 'POST',
                body: JSON.stringify({
                    "quadValue": "<http://megras.org/schema#segmentOf>"
                })
            }
            let response = await fetch("http://localhost:8080/query/predicate", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let data = await response.json()
            let segments = data.results.map(d => d.s)
            let images = data.results.map(d => d.o)
            setSegments(segments)
            setImages([...new Set(images)])
        }

        fetchMedia()
        return () => { }
    }, [])


    const [elements, setElements] = React.useState([]);
    const [selectedId, setSelected] = React.useState(null);

    const stageref = React.useRef();
    const backgroundRef = React.useRef();

    const createCanvas = () => {
        setHasCanvas(true)
    }

    const moveElement = (up) => {
        setSelected(null)
        let elems = elements.slice()
        let idx = elems.findIndex(e => e.id == selectedId)
        let element = elems.splice(idx, 1)[0];
        if (up) {
            elems.splice(idx < elements.length - 1 ? idx + 1 : elements.length - 1, 0, element)
        } else {
            elems.splice(idx > 0 ? idx - 1 : 0, 0, element)
        }
        console.log(elems)
        setElements(elems)
    }

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === backgroundRef.current;
        if (clickedOnEmpty) {
            setSelected(null);
        }
    };

    const addToCanvas = (el) => {
        console.log(el)
        setElements([...elements, {
            url: el.replace("<", "").replace(">", ""),
            id: el + elements.length
        }])
    }

    const deleteSelected = () => {
        let prev = elements
        let after = prev.filter(e => e.id !== selectedId)
        setElements(after)
        setSelected(null)
    }

    const deleteAll = () => {
        setElements([])
        setSelected(null)
    }

    const deleteCanvas = () => {
        setWidth()
        setHeight()
        deleteAll()
        setHasCanvas(false)
    }

    const saveImage = async () => {
        let dataURL = stageref.current.toDataURL()
        let response = await fetch(dataURL)
        if (response == undefined) return
        let blob = await response.blob()

        var body = new FormData()
        body.append("file", blob, "collage.jpg")

        response = await fetch("http://localhost:8080/add/file", { method: 'POST', body: body })
            .catch(e => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        let data = await response.json()
        let uri = data["collage.jpg"]["uri"]
        window.open("http://localhost:8080/" + uri, '_blank').focus();
    }

    const toSVG = () => {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        svg.setAttribute('height', height);
        svg.setAttribute('width', width);

        var bg = document.createElement('rect');
        bg.setAttribute('height', '100%');
        bg.setAttribute('width', '100%');
        bg.setAttribute('fill', 'white');
        svg.appendChild(bg)

        let images = stageref.current.children[0].children
        images = images.slice(1)
        console.log(images)
        for (let image of images) {
            var img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            img.setAttribute('height', image.attrs.height);
            img.setAttribute('width', image.attrs.width);
            img.setAttribute('href', image.attrs.url);
            img.setAttribute('preserveAspectRatio', 'none')
            img.setAttribute('x', image.attrs.x);
            img.setAttribute('y', image.attrs.y);
            if (image.attrs.width) {
                img.setAttribute("transform", `rotate(${image.attrs.rotation} ${image.attrs.x} ${image.attrs.y})`)
                img.setAttribute('height', image.attrs.height);
                img.setAttribute('width', image.attrs.width);
            } else {
                img.setAttribute('height', image.attrs.image.height);
                img.setAttribute('width', image.attrs.image.width);
            }
            svg.appendChild(img);
        }

        const svgtext = new XMLSerializer().serializeToString(svg);
        console.log(svgtext)
        const blob = new Blob([svgtext], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url
        a.download = "canvas.svg"
        a.click()
        window.URL.revokeObjectURL(url);
    }

    return (
        <>
            <div className='App-title'>
                Collage Editor
                <div className='App-subtitle'>Create a collage.</div>
            </div>
            <div className="App-content">
                {!hasCanvas ?
                    <Stack direction="column" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <TextField sx={{ width: '75px' }} label="Width" onChange={(e) => setWidth(Number(e.target.value))} />
                            <Box>x</Box>
                            <TextField sx={{ width: '75px' }} label="Height" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
                        </Stack>
                        <Button variant='contained' color='secondary' disabled={!width || !height} onClick={createCanvas}>Create Canvas</Button>
                    </Stack>
                    :
                    <Stack direction="row" alignItems="start" spacing={2}>
                        <Stack direction="row">
                            <Grid
                                container
                                m={1}
                                maxWidth={'10vw'}
                                height={height}
                                overflow="scroll"
                                justifyContent='center'
                                alignItems='flex-start'
                                spacing={2}
                            >
                                {allImages.map((s, i) => (
                                    <Grid item key={i} xs={12} >
                                        <Paper sx={{ height: '10vh' }} onClick={() => addToCanvas(s)}>
                                            <img
                                                key={i}
                                                src={s.replace("<", "").replace(">", "")}
                                                height='100%'
                                                width='100%'
                                                style={{ objectFit: 'scale-down', cursor: 'copy' }}

                                            />
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                            <Grid
                                container
                                m={1}
                                maxWidth={'10vw'}
                                height={height}
                                overflow="scroll"
                                justifyContent='center'
                                alignItems='flex-start'
                                spacing={2}
                            >
                                {allSegments.map((s, i) => (
                                    <Grid item key={i} xs={12} >
                                        <Paper sx={{ height: '10vh' }} onClick={() => addToCanvas(s)}>
                                            <img
                                                key={i}
                                                src={s.replace("<", "").replace(">", "")}
                                                height='100%'
                                                width='100%'
                                                style={{ objectFit: 'scale-down', cursor: 'copy' }}

                                            />
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Stack>
                        <Stage ref={stageref} width={width} height={height} onMouseDown={checkDeselect}
                            onTouchStart={checkDeselect}>
                            <Layer>
                                <Rect
                                    ref={backgroundRef}
                                    x={0} y={0}
                                    width={width} height={height}
                                    fill='white'
                                />
                                {elements.map((element, i) => {
                                    return (
                                        <ImageElement
                                            id={i}
                                            url={element.url}
                                            shapeProps={element}
                                            isSelected={element.id === selectedId}
                                            width={width}
                                            height={height}
                                            onSelect={() => {
                                                setSelected(element.id);
                                            }}
                                            onChange={(newAttrs) => {
                                                const els = elements.slice();
                                                els[i] = newAttrs;
                                                console.log(els)
                                                setElements(els);
                                            }}
                                        />
                                    )
                                }
                                )}
                            </Layer>
                        </Stage>
                        <Stack direction="column" height={height} justifyContent="space-between">
                            <Stack spacing={2}>
                                <Tooltip title="Remove selected" placement="right">
                                    <IconButton disabled={selectedId == null} onClick={deleteSelected}><DeleteIcon /></IconButton>
                                </Tooltip>
                                <Tooltip title="Remove all" placement="right">
                                    <IconButton disabled={elements.length == 0} onClick={deleteAll}><ClearIcon /></IconButton>
                                </Tooltip>
                                <Tooltip title="Remove canvas" placement="right">
                                    <IconButton onClick={deleteCanvas}><BackspaceIcon /></IconButton>
                                </Tooltip>
                            </Stack>
                            <Stack spacing={2}>
                                <Tooltip title="Move to front" placement="right">
                                    <IconButton disabled={selectedId == null} onClick={() => moveElement(true)}><ArrowDropUpIcon /></IconButton>
                                </Tooltip>
                                <Tooltip title="Move to back" placement="right">
                                    <IconButton disabled={selectedId == null} onClick={() => moveElement(false)}><ArrowDropDownIcon /></IconButton>
                                </Tooltip>
                            </Stack>
                            <Stack spacing={2}>
                                <Tooltip title="Save" placement="right">
                                    <Button variant="contained" color='secondary' disabled={selectedId != null} onClick={saveImage}><SaveIcon /></Button>
                                </Tooltip>
                                <Tooltip title="Download as SVG" placement="right">
                                    <Button variant="contained" color='secondary' disabled={selectedId != null} onClick={toSVG}><DownloadIcon /></Button>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Stack>
                }
            </div>
        </>
    )
}

export default CollageEditor;