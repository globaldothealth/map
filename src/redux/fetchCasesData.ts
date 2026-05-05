export interface FetchedCaseData {
    case_count: number;
    country_code: string;
    id: string;
    label: string;
    last_updated: string;
    lat: number;
    long: number;
    bounds: number[][];
}

export const fetchCasesData = async (dataUrl: string): Promise<FetchedCaseData[]> => {
    const latestFile = await fetch(dataUrl);
    if (latestFile.status !== 200)
        throw new Error('Fetching regional storage failed');

    const parsedData = await latestFile.json();
    return parsedData.filter((data: any) => data.name !== '');
}