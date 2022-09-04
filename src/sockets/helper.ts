import DayJs from 'dayjs';

// eslint-disable-next-line import/prefer-default-export
export const meta = (emitData: any) => ({
    dateTime: DayJs().toISOString(),
    ...emitData
});
