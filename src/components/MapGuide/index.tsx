import Backdrop, {BackdropProps} from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Paper, {PaperProps} from '@mui/material/Paper';
import Draggable from 'react-draggable';
import {useEffect, useRef, useState} from 'react';

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
                <HelpIcon />
                Map guide
            </Button>
            <StyledMapGuideDialog
                fullWidth
                maxWidth="lg"
                open={open}
                onClose={handleClose}
                PaperComponent={PaperComponent}
                slots={{ backdrop: Backdrop }}
                slotProps={{ backdrop: { invisible: false } }}
                scroll="paper"
                aria-labelledby="map-guide"
            >
                <StyledDialogTitle id="map-guide" sx={{color: 'white'}}>
                    Welcome to Global.health Map!
                    <CloseButton aria-label="close" onClick={handleClose}>
                        <CloseIcon/>
                    </CloseButton>
                </StyledDialogTitle>
                <DialogContent>
                    <DialogContentText
                        ref={descriptionElementRef}
                        tabIndex={-1}
                    >
                        These geospatial data visualisations allow you to
                        explore our line-list dataset through a few
                        different views:
                        <br/>
                        <br/>
                        <strong>Country View (admin0/country):</strong> Click on a country to see
                        case count of available line-list data for that country.
                        You can also use the left-hand navigation to search or
                        select a country. Darker colours indicate more cases.
                        Please see our{' '}
                        <a href="https://global.health/faqs/" title="FAQs">
                            FAQs
                        </a>{' '}
                        for more info.
                        <br/>
                        <br/>
                        <strong>State View (admin1):</strong> Click on a region to see
                        case count of available line-list data for that state.
                        Darker colours indicate more available line-list
                        data. Please see our{' '}
                        <a href="https://global.health/faqs/" title="FAQs">
                            FAQs
                        </a>{' '}
                        for more info.
                        <br/>
                        <br/>
                        <strong>Regional View (admin2):</strong> Click on a region to see
                        case count of available line-list data for that region.
                        Darker colours indicate more available line-list
                        data. Please see our{' '}
                        <a href="https://global.health/faqs/" title="FAQs">
                            FAQs
                        </a>{' '}
                        for more info.
                    </DialogContentText>
                </DialogContent>
            </StyledMapGuideDialog>
        </StyledMapGuideButton>
    );
};

export default MapGuide;
