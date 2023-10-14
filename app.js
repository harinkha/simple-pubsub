var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var PublishSubscribeService = /** @class */ (function () {
    function PublishSubscribeService() {
        this.subscribers = {};
    }
    PublishSubscribeService.prototype.publish = function (event) {
        var eventType = event.type();
        if (this.subscribers[eventType]) {
            for (var _i = 0, _a = this.subscribers[eventType]; _i < _a.length; _i++) {
                var subscriber = _a[_i];
                subscriber.handle(event);
            }
        }
    };
    PublishSubscribeService.prototype.subscribe = function (type, handler) {
        if (!this.subscribers[type]) {
            this.subscribers[type] = [];
        }
        this.subscribers[type].push(handler);
    };
    PublishSubscribeService.prototype.unsubscribe = function (type, handler) {
        if (this.subscribers[type]) {
            this.subscribers[type] = this.subscribers[type].filter(function (sub) { return sub !== handler; });
        }
    };
    return PublishSubscribeService;
}());
// implementations
var MachineSaleEvent = /** @class */ (function () {
    function MachineSaleEvent(_sold, _machineId) {
        this._sold = _sold;
        this._machineId = _machineId;
    }
    MachineSaleEvent.prototype.machineId = function () {
        return this._machineId;
    };
    MachineSaleEvent.prototype.getSoldQuantity = function () {
        return this._sold;
    };
    MachineSaleEvent.prototype.type = function () {
        return 'sale';
    };
    return MachineSaleEvent;
}());
var MachineRefillEvent = /** @class */ (function () {
    function MachineRefillEvent(_refill, _machineId) {
        this._refill = _refill;
        this._machineId = _machineId;
    }
    MachineRefillEvent.prototype.machineId = function () {
        return this._machineId;
    };
    MachineRefillEvent.prototype.type = function () {
        return 'refill';
    };
    MachineRefillEvent.prototype.getRefillQuantity = function () {
        return this._refill;
    };
    return MachineRefillEvent;
}());
var MachineSaleSubscriber = /** @class */ (function () {
    function MachineSaleSubscriber(machines, pubSubService) {
        this.machines = machines;
        this.pubSubService = pubSubService;
    }
    MachineSaleSubscriber.prototype.handle = function (event) {
        console.log("Handling sale event for machine ".concat(event.machineId()));
        if (event.type() === 'sale') {
            var machine = this.machines.find(function (m) { return m.id === event.machineId(); });
            if (machine) {
                var saleEvent = event;
                machine.stockLevel -= saleEvent.getSoldQuantity();
                if (machine.stockLevel < 3 && !machine.lowStockWarned) {
                    this.pubSubService.publish(new LowStockWarningEvent(machine.id));
                    machine.lowStockWarned = true;
                }
            }
        }
    };
    return MachineSaleSubscriber;
}());
var MachineRefillSubscriber = /** @class */ (function () {
    function MachineRefillSubscriber(machines, pubSubService) {
        this.machines = machines;
        this.pubSubService = pubSubService;
    }
    MachineRefillSubscriber.prototype.handle = function (event) {
        console.log("Handling refill event for machine ".concat(event.machineId()));
        if (event.type() === 'refill') {
            var machine = this.machines.find(function (m) { return m.id === event.machineId(); });
            if (machine) {
                var refillEvent = event;
                machine.stockLevel += refillEvent.getRefillQuantity();
                if (machine.stockLevel >= 3 && machine.lowStockWarned) {
                    this.pubSubService.publish(new StockLevelOkEvent(machine.id));
                    machine.lowStockWarned = false;
                }
            }
        }
    };
    return MachineRefillSubscriber;
}());
// Handling lowStockWarning
var StockWarningSubscriber = /** @class */ (function () {
    function StockWarningSubscriber(machines, pubSubService) {
        this.machines = machines;
        this.pubSubService = pubSubService;
    }
    StockWarningSubscriber.prototype.handle = function (event) {
        if (event.type() === 'lowStockWarning') {
            console.log("Warning: Low stock for machine ".concat(event.machineId(), ". Triggering refill..."));
            // Automatically refills +10 is the stock is below 3
            var refillQty = 10;
            this.pubSubService.publish(new MachineRefillEvent(refillQty, event.machineId()));
        }
        else if (event.type() === 'stockLevelOk') {
            console.log("Stock level OK for machine ".concat(event.machineId()));
        }
    };
    return StockWarningSubscriber;
}());
var LowStockWarningEvent = /** @class */ (function () {
    function LowStockWarningEvent(_machineId) {
        this._machineId = _machineId;
    }
    LowStockWarningEvent.prototype.machineId = function () {
        return this._machineId;
    };
    LowStockWarningEvent.prototype.type = function () {
        return 'lowStockWarning';
    };
    return LowStockWarningEvent;
}());
var StockLevelOkEvent = /** @class */ (function () {
    function StockLevelOkEvent(_machineId) {
        this._machineId = _machineId;
    }
    StockLevelOkEvent.prototype.machineId = function () {
        return this._machineId;
    };
    StockLevelOkEvent.prototype.type = function () {
        return 'stockLevelOk';
    };
    return StockLevelOkEvent;
}());
// objects
var Machine = /** @class */ (function () {
    function Machine(id, pubSubService) {
        this.pubSubService = pubSubService;
        this._stockLevel = 10;
        this.lowStockWarned = false;
        this.id = id;
    }
    Object.defineProperty(Machine.prototype, "stockLevel", {
        get: function () {
            return this._stockLevel;
        },
        set: function (value) {
            console.log("Setting stock level of machine ".concat(this.id, " to ").concat(value));
            this._stockLevel = value;
            this.checkStockLevel();
        },
        enumerable: false,
        configurable: true
    });
    Machine.prototype.checkStockLevel = function () {
        if (this._stockLevel < 3 && !this.lowStockWarned) {
            this.pubSubService.publish(new LowStockWarningEvent(this.id));
            this.lowStockWarned = true;
        }
        else if (this._stockLevel >= 3 && this.lowStockWarned) {
            this.pubSubService.publish(new StockLevelOkEvent(this.id));
            this.lowStockWarned = false;
        }
    };
    return Machine;
}());
// helpers
var randomMachine = function () {
    var random = Math.random() * 3;
    if (random < 1) {
        return '001';
    }
    else if (random < 2) {
        return '002';
    }
    return '003';
};
var eventGenerator = function () {
    var random = Math.random();
    if (random < 0.5) {
        var saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
        return new MachineSaleEvent(saleQty, randomMachine());
    }
    var refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
    return new MachineRefillEvent(refillQty, randomMachine());
};
// program
(function () { return __awaiter(_this, void 0, void 0, function () {
    var pubSubService, machines, saleSubscriber, refillSubscriber, stockWarningSubscriber, events, _i, events_1, event_1;
    return __generator(this, function (_a) {
        pubSubService = new PublishSubscribeService();
        machines = [
            new Machine('001', pubSubService),
            new Machine('002', pubSubService),
            new Machine('003', pubSubService),
        ];
        saleSubscriber = new MachineSaleSubscriber(machines, pubSubService);
        refillSubscriber = new MachineRefillSubscriber(machines, pubSubService);
        stockWarningSubscriber = new StockWarningSubscriber(machines, pubSubService);
        pubSubService.subscribe('sale', saleSubscriber);
        pubSubService.subscribe('refill', refillSubscriber);
        pubSubService.subscribe('lowStockWarning', stockWarningSubscriber);
        pubSubService.subscribe('stockLevelOk', stockWarningSubscriber);
        events = [1, 2, 3, 4, 5].map(function (i) { return eventGenerator(); });
        // publish the events
        for (_i = 0, events_1 = events; _i < events_1.length; _i++) {
            event_1 = events_1[_i];
            pubSubService.publish(event_1);
        }
        return [2 /*return*/];
    });
}); })();
