import React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { IconButton, Slider, TextField } from '@mui/material';
import ReactPlayer from "react-player";

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import SegmentDialog from './SegmentDialog';
import { BACKEND_URL } from './Api';


function VideoTimeAnnotator({ triggerSnackbar, id }) {
    const videoUrl = BACKEND_URL + "/" + id

    const playerRef = React.useRef(null);
    const [loaded, setLoaded] = React.useState(false);
    const [duration, setDuration] = React.useState(false);
    const [playing, setPlaying] = React.useState(false);

    const [open, setOpen] = React.useState(false);
    const [url, setUrl] = React.useState();

    const [current, setCurrent] = React.useState(0);
    const [slider, setSlider] = React.useState();

    const hasLoaded = () => {
        if (!loaded) {
            let dur = playerRef.current.getDuration()
            setDuration(dur)
            setSlider([0, dur])
            setLoaded(true)

        }
    }

    const setTime = (x) => {
        setCurrent(x)
        playerRef.current.seekTo(x)
    }

    const setRange = (e, v) => {
        setSlider(v)
        if (v[0] > current) {
            setTime(v[0])
        }
        if (v[1] < current) {
            setTime(v[1])
        }
    }

    const play = () => {
        setPlaying(true)
    }

    const pause = () => {
        setPlaying(false)
    }

    const onProgress = (e) => {
        setCurrent(e.playedSeconds)
        if (playerRef.current && e.playedSeconds >= Math.max(...slider)) {
            playerRef.current.seekTo(Math.min(...slider), "seconds")
        }
    }

    const confirm = () => {
        const url = videoUrl + "/segment/time/" + slider.map(s => s * 1000).join("-")
        console.log(url)
        setOpen(true)
        setUrl(url)
    }

    return (
        <>

            <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                playing={playing}
                onReady={hasLoaded}
                progressInterval={100}
                onProgress={onProgress}
                config={{
                    file: {
                        attributes: {
                            crossOrigin: 'anonymous'
                        }
                    }
                }}
            />
            <Stack mb={2} spacing={2} direction="row">
                <IconButton onClick={play}><PlayArrowIcon /></IconButton>
                <IconButton onClick={pause}><PauseIcon /></IconButton>
            </Stack>
            {loaded &&
                <>
                    <Slider
                        valueLabelDisplay="auto"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={current}
                        onChange={(e, v) => setTime(v)}
                        style={{ width: '40%' }}
                    /> <br />
                    <Slider
                        valueLabelDisplay="auto"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={slider}
                        onChange={setRange}
                        style={{ width: '40%' }}
                    /> <br />
                    <Button variant="contained" color='secondary' onClick={confirm}><CheckBoxIcon /></Button>
                </>
            }

            <SegmentDialog
                triggerSnackbar={triggerSnackbar}
                url={url}
                open={open}
                onClose={() => setOpen(false)}
                filetype={"audio/webm"}
            />
        </>
    );
}

export default VideoTimeAnnotator;