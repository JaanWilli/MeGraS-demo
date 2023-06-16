import React from 'react';
import { useParams } from 'react-router';
import ImageAnnotator from './ImageAnnotator';
import VideoAnnotator from './VideoAnnotator';
import { BACKEND_ERR } from './Errors';
import AudioAnnotator from './AudioAnnotator';


function MediaAnnotator({ triggerSnackbar }) {
    const { id } = useParams();

    const [type, setType] = React.useState()

    React.useEffect(() => {
        async function fetchMedia() {

            var response = await fetch("http://localhost:8080/" + id)
                .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
            if (response == undefined) return

            setType(response.headers.get("Content-Type"))
        }
        fetchMedia();
        return () => { }
    }, [])

    return (
        <>
            {type === "image/png" && <ImageAnnotator triggerSnackbar={triggerSnackbar} id={id} />}
            {type === "video/webm" && <VideoAnnotator triggerSnackbar={triggerSnackbar} id={id} />}
            {type === "audio/webm" && <AudioAnnotator triggerSnackbar={triggerSnackbar} id={id} />}
        </>
    );
}

export default MediaAnnotator;