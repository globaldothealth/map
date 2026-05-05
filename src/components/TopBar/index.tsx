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
                            Country
                        </Typography>
                    </NavLink>
                    <NavLink
                        to="/state"
                        className={({isActive}) =>
                            'nav-link stateViewNavButton' +
                            (isActive ? ' activated' : '')
                        }
                    >
                        <Typography variant="navbarlink" gutterBottom>First-level Administrative Division
                        </Typography>
                    </NavLink>
                    <NavLink
                        to="/region"
                        className={({isActive}) =>
                            'nav-link regionalViewNavButton' +
                            (isActive ? ' activated' : '')
                        }
                    >
                        <Typography variant="navbarlink" gutterBottom>
                            Second-level Administrative Division
                        </Typography>
                    </NavLink>
                    <a
                        href={'https://data.global.health/'}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <Typography variant="navbarlink" gutterBottom>
                            Data Portal
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
