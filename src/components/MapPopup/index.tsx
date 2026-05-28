import {
    Popup,
    Title,
    ContentContainer,
    UploadDateContainer,
    UploadDateLabel,
    UploadDate,
} from './styled';

interface MapPopupProps {
    title: string;
    content: JSX.Element;
    lastUploadDate?: string;
}

const MapPopup: React.FC<MapPopupProps> = ({
    title,
    content,
    lastUploadDate,
}: MapPopupProps) => (
    <Popup>
        <Title>{title}</Title>

        <ContentContainer>
            {content}
            {lastUploadDate && lastUploadDate !== 'unknown' && (
                <UploadDateContainer>
                    <UploadDateLabel>
                        Last reported case:{' '}
                        <UploadDate>{lastUploadDate}</UploadDate>
                    </UploadDateLabel>
                </UploadDateContainer>
            )}
        </ContentContainer>
    </Popup>
);


export default MapPopup;
