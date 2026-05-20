import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {NavLink} from 'react-router-dom';

import GHListLogo from 'src/components/GHListLogo';

import {AppBarStyle, NavBar, StyledTooolbar} from './styled';


const TopBar = () => (
    <Box sx={{flexGrow: 1}}>
        <AppBarStyle position="static" className="navbar">
            <StyledTooolbar variant="regular" className="toolbar">
                <GHListLogo/>
                <NavBar>
                    <NavLink
                        to="/country"
                        className={({isActive}) =>
                            'nav-link countryViewNavButton' +
                            (isActive ? ' activated' : '')
                        }
                    >
                        <Typography variant="navbarlink" gutterBottom>
                            Map
                        </Typography>
                    </NavLink>
                    <a
                        href={'https://github.com/globaldothealth/outbreak-data/blob/main/hantavirus/Gh%20Hantavirus%20Timeline.csv'}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <Typography variant="navbarlink" gutterBottom>
                            Timeline
                        </Typography>
                    </a>
                    <a
                        href={'https://github.com/kraemer-lab/Hondius_hantavirus_h2026/blob/main/data/linelist/2026_hantavirus.csv'}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <Typography variant="navbarlink" gutterBottom>
                            Linelist
                        </Typography>
                    </a>
                    <a href="mailto:info@global.health?subject=Feedback regarding Global.health map">
                        <Typography variant="navbarlink" gutterBottom>
                            Feedback
                        </Typography>
                    </a>
                </NavBar>
            </StyledTooolbar>
        </AppBarStyle>
    </Box>
);

export default TopBar;
