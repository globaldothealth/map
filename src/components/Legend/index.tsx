import { LegendRow } from 'src/models/LegendRow';
import { LegendContainer, Title, Row, ColorSample, Label } from './styled';
import Checkbox from '@mui/material/Checkbox';

interface LegendProps {
    title: string;
    legendRows: LegendRow[];
    overlays?: {
            color: string;
            label: string;
            open: boolean;
            toggle: () => void;
        }[]

}

const Legend: React.FC<LegendProps> = ({ title, legendRows, overlays }: LegendProps) => {
    return (
        <LegendContainer>
            <Title>{title}</Title>

            {legendRows.map((row) => (
                <Row key={row.label}>
                    <ColorSample color={row.color} />
                    <Label>{row.label}</Label>
                </Row>
            ))}
            <Title>Overlays</Title>
            {overlays && overlays.map((overlay) => (
                <Row key={overlay.label}>
                    <Checkbox
                        checked={overlay.open}
                        onChange={overlay.toggle}
                        size="small"
                        sx={{ padding: 0 }}
                    />
                    <ColorSample color={overlay.color} />
                    <Label>{overlay.label}</Label>
                </Row>
            ))}
        </LegendContainer>
    );
};

export default Legend;
