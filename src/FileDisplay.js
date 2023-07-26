import React from 'react';
import { Box, IconButton, Stack } from '@mui/material';
import ReactPlayer from "react-player";
import { pdfjs, Document, Page } from 'react-pdf';
import { OBJModel } from 'react-3d-viewer'
import ReactAudioPlayer from 'react-audio-player';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();

const FileDisplay = ({ filetype, filedata, isPreview = false }) => {

    const [numPages, setNumPages] = React.useState(null);
    const [pageNumber, setPageNumber] = React.useState(1);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    const displayFile = () => {
        if (filetype.startsWith("image")) {
            return <img
                src={filedata}
            />
        } else if (filetype.startsWith("video")) {
            return <ReactPlayer
                url={filedata}
                controls
            />
        } else if (filetype === "application/pdf") {
            return <>
                <Document file={filedata} onLoadSuccess={onDocumentLoadSuccess}>
                    <Page
                        pageNumber={pageNumber}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        customTextRenderer={false}
                    />
                </Document>
                <Stack direction="row">
                    <IconButton disabled={pageNumber <= 1} onClick={() => setPageNumber(prev => prev - 1)} ><NavigateBeforeIcon /></IconButton>
                    <Box>{pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}</Box>
                    <IconButton disabled={pageNumber >= numPages} onClick={() => setPageNumber(prev => prev + 1)}><NavigateNextIcon /></IconButton>
                </Stack>
            </>
        } else if (filetype.startsWith("audio")) {
            return <ReactAudioPlayer
                src={filedata}
                controls
            />
        } else if (filetype === "model/obj") {
            return (
                <Box height={500} width={500}>
                    <OBJModel src={filedata} />
                </Box>
            )
        }
    }

    const previewFile = () => {
        if (filetype.startsWith("image") || filetype.startsWith("video") || filetype.startsWith("audio") || filetype === "application/pdf") {
            return <img
                height='100%'
                width='100%'
                src={filedata + "/preview"}
                style={{ objectFit: 'scale-down' }}
            />
        } else if (filetype === "model/obj") {
            return (
                <Box height={500} width={500}>
                    <OBJModel src={filedata} />
                </Box>
            )
        }
    }

    return (isPreview ? previewFile() : displayFile())
}


export default FileDisplay;