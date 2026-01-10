export type DataBusChangeFunction<TData = unknown> = (value: TData, oldValue: TData, path: string[]) => void;
