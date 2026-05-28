import styled from 'styled-components';

export const Popup = styled.div`
    padding: 0.5rem 1rem;
`;

export const Title = styled.h2`
    font-size: 2.4rem;
    font-weight: 400;
`;

export const ContentContainer = styled.div`
    margin: 1.2rem 0;
`;

export const UploadDateContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    margin: '1rem 0 2rem 0',
}));

export const UploadDateLabel = styled('p')(() => ({
    fontSize: '1.6rem',
    fontWeight: 'bold',
}));

export const UploadDate = styled('span')(() => ({
    fontSize: '1.6rem',
    fontWeight: 'normal',
}));

export const PopupContentText = styled('p')(() => ({
    fontSize: '1.6rem',
    fontWeight: 'bold',
}));
