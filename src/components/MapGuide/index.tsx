import {useEffect, useRef, useState} from 'react';
import {Backdrop, Button, DialogContent, DialogContentText, Paper} from '@mui/material';
import {Close as CloseIcon, Help as HelpIcon} from '@mui/icons-material';
import {PaperProps} from '@mui/material/Paper';
import Draggable from 'react-draggable';

import {
    StyledMapGuideDialog,
    StyledMapGuideButton,
    StyledDialogTitle,
    CloseButton,
} from './styled';

const PaperComponent = (props: PaperProps) => {
    return (
        <Draggable
            handle="#map-guide"
            cancel={'[class*="MuiDialogContent-root"]'}
        >
            <Paper {...props} sx={{background: 'rgb(0, 148, 226)'}}/>
        </Draggable>
    );
};

export const MapGuide: React.FC = () => {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const descriptionElementRef = useRef<HTMLElement>(null);
    useEffect(() => {
        if (open) {
            const {current: descriptionElement} = descriptionElementRef;
            if (descriptionElement !== null) {
                descriptionElement.focus();
            }
        }
    }, [open]);

    return (
        <StyledMapGuideButton>
            <Button onClick={handleClickOpen()}>
                <HelpIcon/>
                Map guide
            </Button>
            <StyledMapGuideDialog
                fullWidth
                maxWidth="lg"
                open={open}
                onClose={handleClose}
                PaperComponent={PaperComponent}
                slots={{backdrop: Backdrop}}
                slotProps={{backdrop: {invisible: false}}}
                scroll="paper"
                aria-labelledby="map-guide"
            >
                <StyledDialogTitle id="map-guide" sx={{color: 'white'}}>
                    Welcome to Global.health Map
                    <CloseButton aria-label="close" onClick={handleClose}>
                        <CloseIcon/>
                    </CloseButton>
                </StyledDialogTitle>
                <DialogContent>
                    <DialogContentText
                        ref={descriptionElementRef}
                        tabIndex={-1}
                    >
                        Explore outbreak data using interactive geospatial visualisations. Use the controls and views
                        below to navigate the data.
                        <br/>
                        <br/>
                        <strong>Map views</strong>
                        <ul style={{marginLeft: '2em'}}>
                            <li><strong>Country level</strong> — Admin 0 boundaries. Shows country-level case data
                                across all available outbreaks.
                            </li>
                            <li><strong>State / Province level</strong> — Admin 1 boundaries. Shows state /
                                province-level data where available.
                            </li>
                        </ul>
                        <br/>
                        <strong>How to navigate</strong>
                        <br/>
                        <ol style={{marginLeft: '2em'}}>
                            <li><strong>Select an outbreak</strong> — Use the module on the left to choose from
                                available outbreaks.
                            </li>
                            <li><strong>Choose a geographic resolution</strong> — Switch between country-level and
                                state/province-level views in the same panel.
                            </li>
                            <li><strong>Read the colour scale</strong> — Darker colours indicate higher case counts. The
                                scale adjusts per outbreak and is shown on the right.
                            </li>
                            <li><strong>Access underlying data</strong> — The navigation menu at the top links to the
                                full dataset at Data.Global.health.
                            </li>
                        </ol>
                        <br/>
                        <strong>Feedback</strong> — Questions or comments? Reach out to info@global.health.
                        <br/>
                        <br/>
                        <strong>Disclaimer</strong> — The Global.health Map is a public resource to support outbreak
                        response. All data is subject to change as new reports become available or existing records are
                        reconciled. Due to reporting delays and potential gaps in source data, case information may be
                        incomplete, outdated, or inaccurate and should not be treated as final or as a substitute for
                        official reports. The data displayed reflects only what Global.health has collected and curated
                        from publicly available resources; coverage for a given location or outbreak may be partial or
                        absent.
                    </DialogContentText>
                </DialogContent>
            </StyledMapGuideDialog>
        </StyledMapGuideButton>
    );
};

export default MapGuide;
