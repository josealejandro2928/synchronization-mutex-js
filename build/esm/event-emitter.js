/* eslint-disable @typescript-eslint/no-explicit-any */
export class EventEmitterCustom {
    subscritors = new Map();
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    emit(topic, data) {
        if (!this.subscritors.has(topic)) {
            return;
        }
        for (const fn of this.subscritors.get(topic)) {
            setTimeout(() => {
                fn(data);
                this.subscritors.get(topic)?.delete(fn);
                if (this.subscritors.get(topic)?.size == 0)
                    this.subscritors.delete(topic);
            }, 0);
        }
    }
    once(topic, cb) {
        if (!this.subscritors.has(topic)) {
            this.subscritors.set(topic, new Set());
        }
        this.subscritors.get(topic)?.add(cb);
    }
}
//# sourceMappingURL=event-emitter.js.map