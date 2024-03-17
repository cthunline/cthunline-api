import dayjs from 'dayjs';

export type SocketMeta<T> = T & {
    dateTime: string;
};

export const meta = <T>(emitData: T): SocketMeta<T> => ({
    dateTime: dayjs().toISOString(),
    ...emitData
});
