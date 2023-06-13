import { Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import React from "react";
import CloseIcon from '@mui/icons-material/Close';

function ImageDialog({ open, url, category, onClose }) {

    const [loading, setLoading] = React.useState(true);
    const [redirectUrl, setRedirectUrl] = React.useState();

    React.useEffect(() => {
        async function sendMedia() {
            let response = await fetch(url)
            if (response.ok) {
                setRedirectUrl(response.url)

                var options = {
                    method: 'POST',
                    body: JSON.stringify({
                        "quads": [{
                            "s": "<" + response.url + ">",
                            "p": "<https://schema.org/category>",
                            "o": category + "^^String"
                        }]
                    })
                }
                console.log(options)
                let res = await fetch("http://localhost:8080/add/quads", options)
                console.log(res)
            }
        }

        if (open) {
            sendMedia();
            setLoading(false);
        }
        return () => {}
    })

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
                    <>
                        <a href={redirectUrl} target="_blank">
                            <img src={redirectUrl + "/preview"} />
                        </a>
                        <Box textAlign='center'>Segment saved</Box>
                    </>
                }
            </DialogContent>
        </Dialog>
    )
}

export default ImageDialog;