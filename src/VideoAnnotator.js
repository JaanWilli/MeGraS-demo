import React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import VideoTimeAnnotator from './VideoTimeAnnotator';
import VideoRotoscopeAnnotator from './VideoRotoscopeAnnotator';
import VideoShapeAnnotator from './VideoShapeAnnotator';
import { useNavigate } from 'react-router';
import { CircularProgress } from '@mui/material';
import { BACKEND_URL } from './Api';
import { BACKEND_ERR } from './Errors';


function VideoAnnotator({ triggerSnackbar, id }) {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState();
    const [type, setType] = React.useState();

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
                Video Annotation
                <div className='App-subtitle'>Define new segments of a video.</div>
            </div>
            <div className="App-content">
                {loading ? <CircularProgress /> :
                    <>
                        {!type &&
                            <Stack spacing={2} direction="row">
                                <Button variant='contained' onClick={() => setType("time")}>Time</Button>
                                <Button variant='contained' onClick={() => setType("shape")}>Shape</Button>
                                <Button variant='contained' onClick={() => setType("rotoscope")}>Rotoscope</Button>
                            </Stack>
                        }
                        {type === "time" && <VideoTimeAnnotator id={id} segment={segment} />}
                        {type === "shape" && <VideoShapeAnnotator id={id} segment={segment} />}
                        {type === "rotoscope" && <VideoRotoscopeAnnotator id={id} segment={segment} />}
                    </>
                }
            </div>
        </>
    );
}

export default VideoAnnotator;