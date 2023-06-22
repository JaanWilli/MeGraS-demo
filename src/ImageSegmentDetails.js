import React from 'react';
import { Stage, Layer, Rect, Text, Image, Label, Tag } from 'react-konva';
import useImage from 'use-image';
import { BACKEND_ERR } from './Errors';
import { Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const SegmentImage = ({ url, x, y, opacity }) => {
    const [image] = useImage(url);
    return <Image image={image} x={x} y={y} opacity={opacity} />;
};

const ImageSegmentDetails = (props) => {
    const { allowDelete, triggerSnackbar, objectId, loading, setLoading, details, limitSegments, hideEmpty = false } = props

    const stageref = React.useRef();
    const tooltipref = React.useRef();
    const tooltiptextref = React.useRef();

    const [image, imageStatus] = useImage("http://localhost:8080/" + objectId);

    const [segments, setSegments] = React.useState([])
    const [highlightSegment, setHighlight] = React.useState()
    const [hover, setHover] = React.useState(true)

    const [showImage, setShowImage] = React.useState(true)

    React.useEffect(() => {
        async function fetchSegments() {
            let options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": [],
                    "p": ["<http://megras.org/schema#segmentOf>"],
                    "o": ["<http://localhost:8080/" + objectId + ">"]
                })
            }
            let response = await fetch("http://localhost:8080/query/quads", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            let data = await response.json()

            let segmentURIs = data.results.map(d => d.s)

            let relevantSegments = limitSegments ? segmentURIs.filter(v => limitSegments.includes(v)) : segmentURIs;
            if (hideEmpty && relevantSegments.length == 0) {
                setShowImage(false)
            }

            options = {
                method: 'POST',
                body: JSON.stringify({
                    "s": relevantSegments,
                    "p": ["<https://schema.org/category>", "<http://megras.org/schema#segmentBounds>"],
                    "o": []
                })
            }
            response = await fetch("http://localhost:8080/query/quads", options)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return
            data = await response.json()

            const groupedMap = new Map();
            for (const e of data.results) {
                if (!groupedMap.has(e.s)) {
                    groupedMap.set(e.s, { category: "", x: "", y: "", w: "", h: "" });
                }
                if (e.p == "<https://schema.org/category>") {
                    groupedMap.get(e.s)["category"] = e.o.replace("^^String", "")
                } else if (e.p == "<http://megras.org/schema#segmentBounds>") {
                    let bounds = e.o.replace("^^String", "").split(",")
                    groupedMap.get(e.s)["x"] = Number(bounds[0])
                    groupedMap.get(e.s)["y"] = image.height - Number(bounds[3])
                    groupedMap.get(e.s)["w"] = Number(bounds[1]) - Number(bounds[0])
                    groupedMap.get(e.s)["h"] = Number(bounds[3]) - Number(bounds[2])
                }
            }

            console.log(data)

            setSegments(Array.from(groupedMap, ([url, properties]) => ({ url, ...properties })))
        }

        if (imageStatus == "loaded") {
            fetchSegments();
            setLoading(false);
            return () => { }
        }
    }, [imageStatus])

    const toggleSegment = (idx) => {
        if (hover) {
            if (highlightSegment == idx) {
                setHighlight()
            } else {
                setHighlight(idx)
                let segment = segments[idx]
                tooltiptextref.current.text(segment.category)
                tooltipref.current.x(segment.x)
                tooltipref.current.y(segment.y)
                tooltipref.current.visible(segment.category != "")
            }
        }
    }

    const selectSegment = () => {
        setHover(!hover)
    }

    const deleteSegment = async () => {
        let toDelete = segments[highlightSegment]
        let id = toDelete.url.replace("<http://localhost:8080/", "").replace(">", "")
        let response = await fetch("http://localhost:8080/" + id, { method: 'DELETE' })
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        if (response == undefined) return
        if (response.ok) {
            segments.splice(highlightSegment, 1)
            setSegments(segments)
            setHover(true)
            setHighlight()
        } else {
            console.log(response.statusText)
        }
    }

    return (
        <>
            {imageStatus === "loaded" && showImage ?
                <>
                    <Stage ref={stageref} width={image.width} height={image.height}>
                        <Layer>
                            <Image image={image} opacity={highlightSegment === undefined ? 1 : 0.3} />
                            {segments.map((s, i) => (
                                <>
                                    <SegmentImage
                                        url={s.url.replace("<", "").replace(">", "")}
                                        x={s.x} y={s.y}
                                        opacity={highlightSegment === i ? 1 : 0}
                                    />
                                    <Rect x={s.x} y={s.y}
                                        width={s.w} height={s.h}
                                        onMouseOver={(e) => {
                                            toggleSegment(i)
                                            const container = e.target.getStage().container();
                                            container.style.cursor = "pointer";
                                        }}
                                        onMouseOut={(e) => {
                                            toggleSegment(i)
                                            const container = e.target.getStage().container();
                                            container.style.cursor = "default";
                                        }}
                                        onClick={selectSegment}
                                        stroke="red"
                                        strokeWidth={!hover && highlightSegment === i ? 4 : 1}
                                        visible={highlightSegment === undefined || highlightSegment === i}
                                    />
                                </>
                            ))}
                        </Layer>
                        <Layer visible={highlightSegment !== undefined}>
                            <Label ref={tooltipref} >
                                <Tag fill='#37d2c6'></Tag>
                                <Text ref={tooltiptextref} text='' color="white" padding={5} fontSize={18} />
                            </Label>
                        </Layer>
                    </Stage>
                    {allowDelete &&
                        <Button
                            sx={{ margin: 2 }}
                            variant='contained'
                            color='warning'
                            disabled={hover}
                            startIcon={<DeleteIcon />}
                            onClick={deleteSegment}
                        >
                            Delete Segment
                        </Button>
                    }
                </>
                :
                null
            }
            <br />
            {details}
        </>
    )
}

export default ImageSegmentDetails;