import { styled } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

interface StyledSideBarProps {
    $sidebaropen: boolean;
}

interface LabelProps {
    isActive: boolean;
}

export const StyledSideBar = styled('aside')<StyledSideBarProps>`
    backdrop-filter: blur(0.5rem);
    background-color: white;
    border-radius: 1ex;
    box-shadow: 0 10px 30px 1px rgb(0 0 0 / 10%);
    color: #aaa;
    display: flex;
    flex-direction: column;
    bottom: 25%;
    height: 70%;
    left: ${({ $sidebaropen }) => ($sidebaropen === true ? '2ex' : '-28rem')};
    padding: 2ex;
    position: fixed;
    margin-top: 0;
    top: 15%;
    transition: left 0.2s;
    width: 28rem;
    z-index: 3;

    #sidebar-tab {
        background-color: white;
        border: 1px solid #f0f0f0;
        border-left: 0;
        align-items: center;
        border-top-right-radius: 7px;
        border-bottom-right-radius: 7px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        height: 5ex;
        left: 100%;
        position: absolute;
        top: 10ex;
        width: 2.5ex;
        #sidebar-tab-icon {
            font-size: 80%;
            height: 100%;
            display: flex;
            align-items: center;
        }
    }
    //
`;

export const FlagIcon = styled('img')(() => ({
    marginRight: '2rem',
    flexShrink: 0,
}));

export const CountryLabel = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<LabelProps>(({ isActive }) => ({
    marginRight: '1rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'left',
    flexGrow: 1,
    fontWeight: isActive ? 700 : 400,
}));

export const SideBarHeader = styled('div')(({ theme }) => ({
    cursor: 'default',
    height: 'auto',
    position: 'relative',
    h1: {
        borderRadius: '.4rem',
        display: 'inline-block',
        fontSize: '1.2rem',
        margin: 0,
        padding: '0.7ex 2ex',
        background: theme.primary.main,
        color: theme.primary.contrastText,
    },
}));

export const CountryCaseCount = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<LabelProps>(({ isActive }) => ({
    fontWeight: isActive ? 700 : 400,
    color: '#999',
    marginRight: '1rem',
}));

interface CaseCountsBarProps {
    barWidth: number;
}

export const CaseCountsBar = styled('div', {
    shouldForwardProp: (prop) => prop !== 'barWidth',
})<CaseCountsBarProps>(({ theme, barWidth }) => ({
    background: theme.primary.main,
    height: '.3rem',
    width: barWidth + '%',
    position: 'absolute',
    bottom: 0,
}));

export const LatestGlobal = styled('aside')<{ $sidebaropen: boolean }>`
    margin: 2ex 0;
    #total-cases,
    #total-deaths,
    #p1-cases,
    #b1351-cases {
        display: none;
        color: black;
        font-size: 2.7rem;
        font-weight: 500;
        margin-right: 0.35ex;
    }
    #total-cases {
        display: inline;
    }
    .last-updated-date {
        font-size: 1.2rem;
        color: #999;
        margin-top: 2rem;
    }
`;

export const SearchBar = styled('div')`
    margin-top: 0;
    div:first-of-type {
        width: 100%;
    }
    .MuiAutocomplete-endAdornment {
        display: flex;
        flex-flow: row-reverse;
    }
    .MuiAutocomplete-popper {
        button {
            background-color: #fff;
        }
    }
`;

export const LocationList = styled('div')`
    flex: 1;
    overflow: auto;
    margin-top: 2rem;
`;

interface RegionalLocationListItemProps {
    isActive: boolean;
}

export const LocationListItem = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<RegionalLocationListItemProps>(({ isActive }) => ({
    width: '100%',
    margin: '1rem auto',
    color: '#454545',
    backgroundColor: isActive ? '#f3f3f3' : '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    fontSize: '1.4rem',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',

    '&:hover': {
        backgroundColor: '#f3f3f3',
    },
}));

export const EmptyFlag = styled('div')(() => ({
    width: '2rem',
    marginRight: '2rem',
    display: 'flex',
    justifyContent: 'center',
}));


export const GhListButtonBar = styled('div')`
    background: #edf3f1;
    border-radius: 1ex;
    color: #575c5f;
    cursor: pointer;
    height: 5ex;
    margin-top: 1.5rem;
    padding-top: 0.8rem;
    text-align: center;
    text-decoration: none;
    img {
        order-right: o.1rem solid #555;
        height: 3ex;
        margin-left: 3ex;
        margin-right: 0.6ex;
        object-fit: contain;
        padding-right: 0.6ex;
        vertical-align: middle;
    }
    span {
        color: #137564;
        font-size: 3ex;
        vertical-align: middle;
    }
`;

export const CountriesListSkeleton = styled(Skeleton)(() => ({
    width: '100%',
    height: '100%',
}));

export const SideBarTitlesSkeleton = styled(Skeleton)(() => ({
    width: '100%',
    height: '2.1rem',
}));

export const VersionNumber = styled('a')(() => ({
    fontSize: '1.2rem',
    color: '#999',
    marginTop: '2rem',
    overflow: 'hidden',
    cursor: 'pointer',
    textDecoration: 'none',

    '&:hover': {
        textDecoration: 'underline',
    },
}));
