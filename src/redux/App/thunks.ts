import { createAsyncThunk } from '@reduxjs/toolkit';
import { getUrl } from 'aws-amplify/storage';

import { fetchCasesData, FetchedCaseData } from 'src/redux/fetchCasesData';
import { RootState } from 'src/redux/store';
import { OutbreakNames } from 'src/redux/App/slice';


const mapToAppData = (
    cases: FetchedCaseData[],
): { caseCount: number; lastUpdated: string }[] => {
    return cases.map((fetchedCase: any) => {
        return {
            caseCount: fetchedCase.case_count,
            lastUpdated: fetchedCase.last_updated,
        };
    });
};

export const fetchAppData = createAsyncThunk<
    { totalNumberOfCases: number; lastUpdateDate: string },
    void,
    { rejectValue: string, state: RootState }
>('app/fetchAppData', async (_, { rejectWithValue, getState }) => {
    const outbreakName = getState().app.outbreakName;
    const s3Path = `outbreaks/${OutbreakNames[outbreakName]}/admin0/simplified.json`;
    try {
        const { url } = await getUrl({ path: s3Path, options: { bucket: { bucketName: 'aggregated-map-data', region: 'eu-central-1' } } });

        const fetchedCases = await fetchCasesData(url.toString());
        const appData = mapToAppData(fetchedCases);
        let totalNumberOfCases = 0;
        let lastUpdateDate = appData[0].lastUpdated;
        for (const result of appData) {
            totalNumberOfCases += result.caseCount;
            if (result.lastUpdated > lastUpdateDate) {
                lastUpdateDate = result.lastUpdated;
            }
        }

        const urlP = 'https://raw.githubusercontent.com/kraemer-lab/Hondius_hantavirus_h2026/refs/heads/main/data/linelist/2026_hantavirus.csv';
        const pathData = await fetch(urlP)
            .then(response => response.text())
            .then(csvText => {
                const parseCsvLine = (line: string): string[] => {
                    const result: string[] = [];
                    let current = '';
                    let inQuotes = false;
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            result.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    result.push(current.trim());
                    return result;
                };

                const lines = csvText.split('\n').filter(l => l.trim());
                const headers = parseCsvLine(lines[0]);
                const data = lines.slice(1).map(line => {
                    const values = parseCsvLine(line.replace(/\r$/, ''));
                    const entry: { [key: string]: string } = {};

                    headers.forEach((header, index) => {
                        entry[header] = values[index];
                    });
                    return entry;
                });
                return data;
            })
        const lastUpdateDateFromPathData = pathData.filter(entry => entry['status'] === 'confirmed').reduce((latest, entry) => {
            const entryDate = new Date(entry['confirmation_date']);
            return entryDate > latest ? entryDate : latest;
        }, new Date(0)).toISOString();

        return { totalNumberOfCases, lastUpdateDate: lastUpdateDateFromPathData };
    } catch (err: any) {
        console.log('ERR', err);
        if (err.response) return rejectWithValue(err.response.message);
        throw err;
    }
});
