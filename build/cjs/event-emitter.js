"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitterCustom = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
class EventEmitterCustom {
    constructor() {
        this.subscritors = new Map();
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    emit(topic, data) {
        if (!this.subscritors.has(topic)) {
            return;
        }
        for (const fn of this.subscritors.get(topic)) {
            setTimeout(() => {
                var _a, _b;
                fn(data);
                (_a = this.subscritors.get(topic)) === null || _a === void 0 ? void 0 : _a.delete(fn);
                if (((_b = this.subscritors.get(topic)) === null || _b === void 0 ? void 0 : _b.size) == 0)
                    this.subscritors.delete(topic);
            }, 0);
        }
    }
    once(topic, cb) {
        var _a;
        if (!this.subscritors.has(topic)) {
            this.subscritors.set(topic, new Set());
        }
        (_a = this.subscritors.get(topic)) === null || _a === void 0 ? void 0 : _a.add(cb);
    }
}
exports.EventEmitterCustom = EventEmitterCustom;
//# sourceMappingURL=event-emitter.js.map