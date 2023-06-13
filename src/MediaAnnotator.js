import React from 'react';
import { useParams } from 'react-router';
import ImageAnnotator from './ImageAnnotator';
import VideoAnnotator from './VideoAnnotator';


function MediaAnnotator() {
    const { id } = useParams();

    const [type, setType] = React.useState()

    React.useEffect(() => {
        async function fetchMedia() {

            var response = await fetch("http://localhost:8080/" + id)

            setType(response.headers.get("Content-Type"))
        }
        fetchMedia();
        return () => { }
    }, [])

    return (
        <>
            {type === "image/png" && <ImageAnnotator id={id} />}
            {type === "video/webm" && <VideoAnnotator id={id} />}
        </>
    );
}

export default MediaAnnotator;