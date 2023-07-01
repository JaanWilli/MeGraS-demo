import { Box, Button, CircularProgress, Grid, IconButton, Paper, Stack, TextField, Tooltip } from '@mui/material';
import React from 'react';
import { Image, Layer, Rect, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { BACKEND_ERR, PREDICTOR_ERR } from './Errors';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { BACKEND_URL, PREDICTOR_URL } from './Api';
import { useNavigate } from 'react-router';


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
                                rotation: node.rotation()
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
    const navigate = useNavigate()

    const [width, setWidth] = React.useState(800)
    const [height, setHeight] = React.useState(500)
    const [tempWidth, setTempWidth] = React.useState(800)
    const [tempHeight, setTempHeight] = React.useState(500)

    const [allImages, setAllImages] = React.useState([])
    const [allSegments, setAllSegments] = React.useState([])
    const [images, setImages] = React.useState([])
    const [segments, setSegments] = React.useState([])

    const [elements, setElements] = React.useState([]);
    const [selectedId, setSelected] = React.useState(null);

    const [query, setQuery] = React.useState();
    const [loading, setLoading] = React.useState(false);

    const stageref = React.useRef();
    const backgroundRef = React.useRef();

    React.useEffect(() => {
        async function fetchMedia() {
            let options = {
                method: 'POST',
                body: JSON.stringify({
                    "quadValue": "<http://megras.org/schema#segmentOf>"
                })
            }
            let response = await fetch(BACKEND_URL + "/query/predicate", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let data = await response.json()
            let segments = data.results.map(d => d.s)
            let images = data.results.map(d => d.o)
            images = [...new Set(images)]
            setAllImages(images)
            setAllSegments(segments)
            setImages(images)
            setSegments(segments)
        }

        fetchMedia()
        return () => { }
    }, [])

    const applyDimensions = () => {
        setWidth(tempWidth)
        setHeight(tempHeight)
    }

    const moveElement = (up) => {
        setSelected(null)
        console.log(elements)
        let elems = elements.slice()
        let idx = elems.findIndex(e => e.id == selectedId)
        let element = elems.splice(idx, 1)[0];
        if (up) {
            elems.splice(idx < elements.length - 1 ? idx + 1 : elements.length - 1, 0, element)
        } else {
            elems.splice(idx > 0 ? idx - 1 : 0, 0, element)
        }
        setElements(elems)
    }

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === backgroundRef.current;
        if (clickedOnEmpty) {
            setSelected(null);
        }
    };

    const addToCanvas = (el) => {
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

    const search = async (images) => {
        if (!query) {
            images ? setImages(allImages) : setSegments(allSegments)
            return
        }

        let urls = new Set()

        if (!images) {
            let sparql = `SELECT DISTINCT ?cLabel WHERE{  ?item ?label "${query}"@en. ?c wdt:P279 / wdt:P279? ?item . SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`
            let res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + sparql)
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
            data.results.forEach(r => {
                if (r.s.startsWith("<")) {
                    urls.add(r.s)
                }
            })
        }

        if (urls.size == 0) {
            let pred = images ? "<http://megras.org/schema#captionVector>" : "<http://megras.org/schema#categoryVector>"
            let seg_embed = await fetch(PREDICTOR_URL + "/embedding/" + query)
                .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
            if (seg_embed == undefined) return
            let embedding = await seg_embed.text()
            let vector = embedding.slice(1, embedding.length - 2).split(",").map(v => Number(v))

            var options = {
                method: 'POST',
                body: JSON.stringify({
                    "predicate": pred,
                    "object": vector,
                    "count": 1,
                    "distance": "COSINE"
                })
            }
            let response = await fetch(BACKEND_URL + "/query/knn", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let data = await response.json()

            data.results.forEach(r => {
                if (r.s.startsWith("<")) {
                    urls.add(r.s)
                }
            })
        }

        images ? setImages(Array.from(urls)) : setSegments(Array.from(urls))
    }

    const saveImage = async () => {
        setLoading(true)
        let dataURL = stageref.current.toDataURL()
        let response = await fetch(dataURL)
        if (response == undefined) return
        let blob = await response.blob()

        var body = new FormData()
        body.append("file", blob, "collage.jpg")

        response = await fetch(BACKEND_URL + "/add/file", { method: 'POST', body: body })
            .catch(e => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        let data = await response.json()
        let uri = data["collage.jpg"]["uri"]
        setLoading(false)
        return navigate("/" + uri)
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
                {loading ? <CircularProgress /> :
                    <>

                        <Stack direction="row" alignItems="start" spacing={2}>
                            <Stack direction="row">
                                {[images, segments].map((collection) => (
                                    <Stack direction="column" spacing={2} mx={1}>
                                        <Box width='10vw'>
                                            <TextField
                                                label="Filter"
                                                onChange={(e) => setQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        let searchImages = collection == images
                                                        search(searchImages)
                                                    }
                                                }}
                                            />
                                        </Box>
                                        <Stack
                                            direction="column"
                                            maxWidth='10vw'
                                            height="70vh"
                                            overflow="scroll"
                                            justifyContent='flex-start'
                                            alignItems='center'
                                            spacing={2}
                                        >
                                            {collection.map((s, i) => (
                                                <Paper sx={{ height: '10vh' }} onClick={() => addToCanvas(s)}>
                                                    <img
                                                        key={i}
                                                        src={s.replace("<", "").replace(">", "")}
                                                        height='100%'
                                                        width='100%'
                                                        style={{ objectFit: 'scale-down', cursor: 'copy' }}

                                                    />
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Stack>
                                ))}
                            </Stack>
                            <Stack direction="column" spacing={2} justifyContent="center" alignItems="center">
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <TextField sx={{ width: '75px' }} label="Width" value={tempWidth} onChange={(e) => setTempWidth(Number(e.target.value))} />
                                    <Box>x</Box>
                                    <TextField sx={{ width: '75px' }} label="Height" value={tempHeight} onChange={(e) => setTempHeight(Number(e.target.value))} />
                                    <IconButton color='secondary' disabled={tempWidth == 0 || tempHeight == 0} onClick={applyDimensions}><CheckIcon /></IconButton>
                                </Stack>
                                <Stack direction="row" spacing={2}>

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
                                            <Tooltip title="Download as SVG" placement="right">
                                                <Button variant="contained" disabled={selectedId != null} onClick={toSVG}><DownloadIcon /></Button>
                                            </Tooltip>
                                            <Tooltip title="Save" placement="right">
                                                <Button variant="contained" color='secondary' disabled={selectedId != null} onClick={saveImage}><SaveIcon /></Button>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Stack>
                    </>
                }
            </div>
        </>
    )
}

export default CollageEditor;