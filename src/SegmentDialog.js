import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Stack, TextField } from "@mui/material";
import React from "react";
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { BACKEND_ERR, PREDICTOR_ERR } from "./Errors";
import FileDisplay from "./FileDisplay";
import { BACKEND_URL, PREDICTOR_URL } from "./Api";

function SegmentDialog(props) {
    const { triggerSnackbar, open, url, onClose, filetype } = props

    const [loading, setLoading] = React.useState(false);
    const [redirectUrl, setRedirectUrl] = React.useState();

    const [category, setCategory] = React.useState();
    const [categorySent, setCategorySent] = React.useState(false);
    const [categoryLoading, setCategoryLoading] = React.useState(false);


    React.useEffect(() => {
        async function sendMedia() {
            setLoading(true)
            let response = await fetch(url)
            if (response.ok) {
                setRedirectUrl(response.url)
                setLoading(false)
            }
        }

        if (open) {
            sendMedia();
        }
        return () => { }
    }, [open])

    const generateCategory = async () => {
        setCategoryLoading(true)
        let response = await fetch(PREDICTOR_URL + "/caption/" + redirectUrl.replace(BACKEND_URL + "/", ""))
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (response == undefined) return
        let category = await response.text()
        setCategory(category)
        setCategoryLoading(false)
    }

    const sendCategory = async () => {
        let quads = []

        quads.push({
            "s": "<" + redirectUrl + ">",
            "p": "<https://schema.org/category>",
            "o": category + "^^String"
        })

        let embed_response = await fetch(PREDICTOR_URL + "/embedding/" + category)
            .catch(() => triggerSnackbar(PREDICTOR_ERR, "error"))
        if (embed_response == undefined) return
        let embedding = await embed_response.text()
        quads.push({
            "s": "<" + redirectUrl + ">",
            "p": "<http://megras.org/schema#categoryVector>",
            "o": embedding.trim()
        })

        var options = {
            method: 'POST',
            body: JSON.stringify({
                "quads": quads
            })
        }
        let res = await fetch(BACKEND_URL + "/add/quads", options)
            .catch(() => triggerSnackbar(BACKEND_ERR, "error"))
        console.log(res)
        setCategorySent(true)
    }

    return (
        <Dialog onClose={onClose} open={open} maxWidth="xl">
            <DialogTitle sx={{ m: 1, p: 2 }}>
                {onClose ? (
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                ) : null}
            </DialogTitle>
            <DialogContent>
                {loading ?
                    <CircularProgress />
                    :
                    <Stack direction="column" spacing={2} justifyContent="center" alignItems="center">
                        <a href={redirectUrl} target="_blank">
                            <FileDisplay
                                filedata={redirectUrl}
                                filetype={filetype}
                            />
                        </a>
                        {categorySent &&
                            <Stack spacing={2} direction="row" justifyContent="center">
                                <Box>{category}</Box>
                            </Stack>
                        }
                        {!categorySent && filetype !== "image/png" &&
                            <Stack spacing={2} direction="row" justifyContent="center">
                                <TextField label="Category" onChange={(e) => setCategory(e.target.value.toLowerCase())} />
                                <Button variant="contained" color='secondary' onClick={sendCategory}><CheckBoxIcon /></Button>
                            </Stack>
                        }
                        {!categorySent && filetype === "image/png" &&
                            <Stack spacing={2} mt={2} direction="row" alignItems="center">
                                <Box>Category:</Box>
                                <TextField sx={{ width: '10vw' }} multiline value={category} onChange={(e) => setCategory(e.target.value)} />
                                {categoryLoading ?
                                    <CircularProgress />
                                    :
                                    <IconButton onClick={generateCategory}><AutoAwesomeIcon /></IconButton>
                                }
                                <Button variant='contained' color='secondary' disabled={!category} onClick={sendCategory}>Send</Button>
                            </Stack>
                        }
                    </Stack>
                }
            </DialogContent>
        </Dialog>
    )
}

export default SegmentDialog;