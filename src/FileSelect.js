import { Box, Button } from '@mui/material';
import './App.css';
import React from 'react';
import { useDropzone } from 'react-dropzone'
import AddIcon from '@mui/icons-material/Add';


const FileSelect = ({ handleFileUpload, multiple, accept="*" }) => {

    const onDrop = React.useCallback(files => {
        handleFileUpload(files)
    }, [])
    const { getRootProps } = useDropzone({ onDrop })

    const onFileSelect = (e) => {
        if (!e.target.files) {
            return;
        }
        handleFileUpload(e.target.files)
    }

    return (
        <>
            <Button
                component="label"
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ m: 1 }}
            >
                Select from computer
                <input
                    type="file"
                    accept={accept}
                    hidden
                    multiple={multiple}
                    onChange={onFileSelect}
                />
            </Button>
            <Box sx={{ m: 1 }}>or</Box>
            <Box
                m={2}
                p={5}
                width='20vw'
                sx={{ border: '2px dashed #444d4e', borderRadius: '10px' }}
                {...getRootProps()}
            >Drop here</Box>
        </>
    )
}

export default FileSelect;