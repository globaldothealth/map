import logo from 'src/assets/images/gh_logo.svg';
import { LogoStyles, LogoImage } from './styled';
import MapGuide from 'src/components/MapGuide';

export default function GHListLogo(): JSX.Element {
    return (
        <LogoStyles id="logo">
            <a href="https://global.health/">
                <div id="logo-container">
                    <LogoImage src={logo} />
                    <span className="logoText">Map</span>
                </div>
            </a>
            <MapGuide />
        </LogoStyles>
    );
}
