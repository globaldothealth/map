import ButtonGroup from '@mui/material/ButtonGroup';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import { selectDataType } from 'src/redux/Country/selectors';

import { DataTypeButton } from './styled';
import { DataType, setDataType } from "src/redux/Country/slice";

export const DataTypeButtons = () => {
    const dispatch = useAppDispatch();

    const dataType = useAppSelector(selectDataType);

    return (
        <ButtonGroup
            size="small"
            disableElevation
            sx={{ marginBottom: '2rem' }}
            orientation="vertical"
        >
            <DataTypeButton
                variant={
                    dataType === DataType.Confirmed ? 'contained' : 'outlined'
                }
                selected={dataType === DataType.Confirmed}
                onClick={() => dispatch(setDataType(DataType.Confirmed))}
            >
                Confirmed
            </DataTypeButton>
            <DataTypeButton
                variant={
                    dataType === DataType.Combined ? 'contained' : 'outlined'
                }
                selected={dataType === DataType.Combined}
                onClick={() => dispatch(setDataType(DataType.Combined))}
            >
                Confirmed and Probable
            </DataTypeButton>
        </ButtonGroup>
    );
};