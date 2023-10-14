// interfaces
interface IEvent {
    type(): string;

    machineId(): string;
}

interface ISubscriber {
    handle(event: IEvent): void;
}

interface IPublishSubscribeService {
    publish(event: IEvent): void;

    subscribe(type: string, handler: ISubscriber): void;

    unsubscribe(type: string, handler: ISubscriber): void;
}

class PublishSubscribeService implements IPublishSubscribeService {
    private subscribers: { [type: string]: ISubscriber[] } = {};

    publish(event: IEvent): void {
        const eventType = event.type();
        if (this.subscribers[eventType]) {
            for (let subscriber of this.subscribers[eventType]) {
                subscriber.handle(event);
            }
        }
    }

    subscribe(type: string, handler: ISubscriber): void {
        if (!this.subscribers[type]) {
            this.subscribers[type] = [];
        }
        this.subscribers[type].push(handler);
    }

    unsubscribe(type: string, handler: ISubscriber): void {
        if (this.subscribers[type]) {
            this.subscribers[type] = this.subscribers[type].filter(sub => sub !== handler);
        }
    }
}


// implementations
class MachineSaleEvent implements IEvent {
    constructor(private readonly _sold: number, private readonly _machineId: string) {
    }

    machineId(): string {
        return this._machineId;
    }

    getSoldQuantity(): number {
        return this._sold
    }

    type(): string {
        return 'sale';
    }
}

class MachineRefillEvent implements IEvent {
    constructor(private readonly _refill: number, private readonly _machineId: string) {
    }

    machineId(): string {
        return this._machineId;
    }

    type(): string {
        return 'refill';
    }

    getRefillQuantity(): number {
        return this._refill;
    }
}

class MachineSaleSubscriber implements ISubscriber {
    constructor(private machines: Machine[], private pubSubService: PublishSubscribeService) {
    }

    handle(event: IEvent): void {
        console.log(`Handling sale event for machine ${event.machineId()}`);
        if (event.type() === 'sale') {
            const machine = this.machines.find(m => m.id === event.machineId());
            if (machine) {
                const saleEvent = event as MachineSaleEvent;
                machine.stockLevel -= saleEvent.getSoldQuantity();

                if (machine.stockLevel < 3 && !machine.lowStockWarned) {
                    this.pubSubService.publish(new LowStockWarningEvent(machine.id));
                    machine.lowStockWarned = true;
                }
            }
        }
    }
}

class MachineRefillSubscriber implements ISubscriber {
    constructor(private machines: Machine[], private pubSubService: PublishSubscribeService) {
    }

    handle(event: IEvent): void {
        console.log(`Handling refill event for machine ${event.machineId()}`);
        if (event.type() === 'refill') {
            const machine = this.machines.find(m => m.id === event.machineId());
            if (machine) {
                const refillEvent = event as MachineRefillEvent;
                machine.stockLevel += refillEvent.getRefillQuantity();

                if (machine.stockLevel >= 3 && machine.lowStockWarned) {
                    this.pubSubService.publish(new StockLevelOkEvent(machine.id));
                    machine.lowStockWarned = false;
                }
            }
        }
    }
}

// Handling lowStockWarning
class StockWarningSubscriber implements ISubscriber {
    constructor(private machines: Machine[], private pubSubService: PublishSubscribeService) {
    }

    handle(event: IEvent): void {
        if (event.type() === 'lowStockWarning') {
            console.log(`Warning: Low stock for machine ${event.machineId()}. Triggering refill...`);

            // Automatically refills +10 is the stock is below 3
            const refillQty = 10;

            this.pubSubService.publish(new MachineRefillEvent(refillQty, event.machineId()));
        } else if (event.type() === 'stockLevelOk') {
            console.log(`Stock level OK for machine ${event.machineId()}`);
        }
    }
}


class LowStockWarningEvent implements IEvent {
    constructor(private readonly _machineId: string) {
    }

    machineId(): string {
        return this._machineId;
    }

    type(): string {
        return 'lowStockWarning';
    }
}

class StockLevelOkEvent implements IEvent {
    constructor(private readonly _machineId: string) {
    }

    machineId(): string {
        return this._machineId;
    }

    type(): string {
        return 'stockLevelOk';
    }
}


// objects
class Machine {
    public id: string;
    private _stockLevel: number = 10;
    public lowStockWarned: boolean = false;

    constructor(id: string, private pubSubService: PublishSubscribeService) {
        this.id = id;
    }

    get stockLevel(): number {
        return this._stockLevel;
    }

    set stockLevel(value: number) {
        console.log(`Setting stock level of machine ${this.id} to ${value}`);
        this._stockLevel = value;
        this.checkStockLevel();
    }

    private checkStockLevel(): void {
        if (this._stockLevel < 3 && !this.lowStockWarned) {
            this.pubSubService.publish(new LowStockWarningEvent(this.id));
            this.lowStockWarned = true;

        } else if (this._stockLevel >= 3 && this.lowStockWarned) {
            this.pubSubService.publish(new StockLevelOkEvent(this.id));
            this.lowStockWarned = false;
        }
    }
}


// helpers
const randomMachine = (): string => {
    const random = Math.random() * 3;
    if (random < 1) {
        return '001';
    } else if (random < 2) {
        return '002';
    }
    return '003';

}

const eventGenerator = (): IEvent => {
    const random = Math.random();
    if (random < 0.5) {
        const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
        return new MachineSaleEvent(saleQty, randomMachine());
    }
    const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
    return new MachineRefillEvent(refillQty, randomMachine());
}


// program
(async () => {
    //Configure the PubSub Service
    const pubSubService = new PublishSubscribeService();

    // create 3 machines with a quantity of 10 stock
    const machines: Machine[] = [
        new Machine('001', pubSubService),
        new Machine('002', pubSubService),
        new Machine('003', pubSubService),
    ];

    const saleSubscriber = new MachineSaleSubscriber(machines, pubSubService);
    const refillSubscriber = new MachineRefillSubscriber(machines, pubSubService);
    const stockWarningSubscriber = new StockWarningSubscriber(machines, pubSubService);

    pubSubService.subscribe('sale', saleSubscriber);
    pubSubService.subscribe('refill', refillSubscriber);
    pubSubService.subscribe('lowStockWarning', stockWarningSubscriber);
    pubSubService.subscribe('stockLevelOk', stockWarningSubscriber);

    // create 5 random events
    const events: IEvent[] = [1, 2, 3, 4, 5].map(i => eventGenerator());

    // publish the events
    for (const event of events) {
        pubSubService.publish(event);
    }
})();
