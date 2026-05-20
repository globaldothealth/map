import {useEffect, useRef, useState} from 'react';
import {Backdrop, Button, DialogContent, DialogContentText, Paper, Typography} from '@mui/material';
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
                    How to Use the Global.health Hantavirus Map
                    <CloseButton aria-label="close" onClick={handleClose}>
                        <CloseIcon/>
                    </CloseButton>
                </StyledDialogTitle>
                <DialogContent>
                    <DialogContentText
                        ref={descriptionElementRef}
                        tabIndex={-1}
                    >
                        This guide explains the Global.health resources related to the <em>MV Hondius</em> 2026
                        hantavirus outbreak (Hantavirus h2026) that are accessible through the Map View.
                        <br/>
                        <br/>
                        <Typography variant='h6'>Data</Typography>
                        Click <strong>Data</strong> to access the latest downloadable <span
                        style={{fontFamily: 'monospace'}}>.csv</span> line list containing
                        epidemiological data for reported human cases. Case data are updated as new public reports
                        become available and may be revised as additional information is confirmed.
                        <br/>
                        <br/>
                        <Typography variant='h6'>Timeline</Typography>
                        Click <strong>Timeline</strong> to view a chronological overview of major outbreak events and
                        response milestones.
                        <br/>
                        <br/>
                        <Typography variant='h6'>Map</Typography>
                        Click <strong>Map</strong> to explore confirmed and probable human hantavirus cases linked to
                        the outbreak. The map is powered by the Global.health line-list dataset.
                        <br/>
                        <br/>
                        Cases that cannot be associated with a specific country are grouped under <strong>Other*</strong>.
                        <br/>
                        <ul>
                            <li style={{marginLeft: '2em'}}><strong>Other*</strong> = Case 1 (Gh_ID1) became ill onboard
                                and died at sea along the ship route between South Georgia and Tristan da Cunha. No
                                microbiological testing was performed, and the case is classified as probable.
                            </li>
                            <li style={{marginLeft: '2em'}}><strong>Other**</strong> = Case 4 (Gh_ID4) became ill
                                onboard and died at sea along the ship route near Cape Verde (Cabo Verde).
                            </li>
                        </ul>
                        <br/>
                        <Typography variant='h6'>Data Overlays</Typography>
                        Optional map overlays are available to provide additional context, including:
                        <ul>
                            <li style={{marginLeft: '2em'}}>Significant outbreak events</li>
                            <li style={{marginLeft: '2em'}}>The <em>MV Hondius</em> cruise ship route</li>
                            <li style={{marginLeft: '2em'}}>Disembarkation in Tenerife, Canary Islands, Spain, where passengers and some crew departed and returned to their home countries</li>
                        </ul>
                        <br/>
                        <Typography variant='h6'>Feedback</Typography>
                        Click <strong>Feedback</strong> to send an email to the Global.health team.

                    </DialogContentText>
                </DialogContent>
            </StyledMapGuideDialog>
        </StyledMapGuideButton>
    );
};

export default MapGuide;
