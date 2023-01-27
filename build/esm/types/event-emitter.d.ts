export declare class EventEmitterCustom {
    subscritors: Map<string, Set<(...params: any[]) => any>>;
    emit(topic: string, data: any): void;
    once(topic: string, cb: (...params: any[]) => any): void;
}
