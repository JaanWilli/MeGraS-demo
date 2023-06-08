import { Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import React from "react";
import CloseIcon from '@mui/icons-material/Close';

function ImageDialog({ open, url, onClose }) {

    const [loading, setLoading] = React.useState(true);
    const [redirectUrl, setRedirectUrl] = React.useState();

    React.useEffect(() => {
        fetch(url)
            .then(response => {
                setRedirectUrl(response.url)
                setLoading(false)
            })
            .catch(e => console.log(e))
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
                            <img src={redirectUrl} />
                        </a>
                        <Box textAlign='center'>Segment saved</Box>
                    </>
                }
            </DialogContent>
        </Dialog>
    )
}

export default ImageDialog;