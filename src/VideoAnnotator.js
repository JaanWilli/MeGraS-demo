import React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import VideoTimeAnnotator from './VideoTimeAnnotator';
import VideoRotoscopeAnnotator from './VideoRotoscopeAnnotator';


function VideoAnnotator({ triggerSnackbar, id }) {

    const [type, setType] = React.useState();

    return (
        <>
            <div className='App-title'>
                Video Annotation
                <div className='App-subtitle'>Define new segments of a video.</div>
            </div>
            <div className="App-content">
                {!type &&
                    <Stack spacing={2} direction="row">
                        <Button variant='contained' onClick={() => setType("time")}>Time</Button>
                        <Button variant='contained' onClick={() => setType("rotoscope")}>Rotoscope</Button>
                    </Stack>
                }
                {type === "time" && <VideoTimeAnnotator triggerSnackbar={triggerSnackbar} id={id} />}
                {type === "rotoscope" && <VideoRotoscopeAnnotator triggerSnackbar={triggerSnackbar} id={id} />}
            </div>
        </>
    );
}

export default VideoAnnotator;