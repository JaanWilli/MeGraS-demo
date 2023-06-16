import React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { IconButton, Slider, TextField } from '@mui/material';
import ReactAudioPlayer from 'react-audio-player';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import SegmentDialog from './SegmentDialog';


const AudioAnnotator = ({ triggerSnackbar, id }) => {
    const audioUrl = "http://localhost:8080/" + id

    const playerRef = React.useRef(null);
    const [loaded, setLoaded] = React.useState(false);
    const [duration, setDuration] = React.useState(false);

    const [open, setOpen] = React.useState(false);
    const [url, setUrl] = React.useState();

    const [current, setCurrent] = React.useState(0);
    const [slider, setSlider] = React.useState();

    const hasLoaded = () => {
        let dur = playerRef.current.audioEl.current.duration
        setDuration(dur)
        setSlider([0, dur])
        setLoaded(true)
    }

    const setRange = (e, v) => {
        setSlider(v)
        if (v[0] > current) {
            changeTime(v[0])
        }
        if (v[1] < current) {
            changeTime(v[1])
        }
    }

    const changeTime = (newTime) => {
        setCurrent(newTime)
        if (playerRef.current) {
            playerRef.current.audioEl.current.currentTime = newTime
        }
    }

    const play = () => {
        if (playerRef.current) {
            playerRef.current.audioEl.current.play()
        }
    }

    const pause = () => {
        if (playerRef.current) {
            playerRef.current.audioEl.current.pause()
        }
    }

    const onListen = (e) => {
        setCurrent(e)
        if (playerRef.current && e >= Math.max(...slider)) {
            playerRef.current.audioEl.current.currentTime = Math.min(...slider)
            setSlider([slider[0], slider[1]])
        }
    }

    const confirm = () => {
        const url = audioUrl + "/segment/time/" + slider.join("-")
        console.log(url)
        setOpen(true)
        setUrl(url)
    }

    return (
        <>
            <div className='App-title'>
                Video Annotation
                <div className='App-subtitle'>Define new segments of a video.</div>
            </div>
            <div className="App-content">
                <ReactAudioPlayer
                    ref={playerRef}
                    src={audioUrl}
                    onListen={onListen}
                    listenInterval={100}
                    onLoadedMetadata={hasLoaded}
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
                            value={current}
                            onChange={(e, v) => changeTime(v)}
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
            </div>
        </>
    )
}

export default AudioAnnotator;