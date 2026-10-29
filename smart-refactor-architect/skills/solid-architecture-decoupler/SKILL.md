---
name: solid-architecture-decoupler
description: Dismantles monolithic God Classes into Clean/Hexagonal Architecture using SOLID principles, ports, and domain adapters.
---

# SOLID Architecture Decoupler Skill

## Overview
The `solid-architecture-decoupler` skill provides formal architectural blueprints, patterns, and refactoring strategies to dismantle monolithic "God Classes", enforce Clean / Hexagonal Architecture, isolate I/O boundaries, and apply SOLID design principles to mission-critical applications.

---

## 1. Deconstructing the God-Class Anti-Pattern

### 1.1 Symptoms of a God Class
- **Lines of Code (LOC)**: Often exceeds 500-1,000+ lines.
- **Low Cohesion**: Intertwines domain rules, SQL/database queries, external API network calls, formatting/serialization, and UI notifications.
- **High Inbound/Outbound Coupling**: Imported by nearly every module and imports dozens of disparate libraries.
- **Testing Nightmare**: Requires complex integration fixtures, live databases, or massive mock setups just to test a single conditional branch.

### 1.2 The 5-Step Dismantling Workflow
```
[ Legacy God Class ]
        │
        ├── 1. Responsibility Boundary Analysis (Cluster methods by cohesion)
        │
        ├── 2. Extract Pure Domain Entities (Zero I/O, business rules only)
        │
        ├── 3. Define Domain Ports / Interfaces (Abstract repositories & gateways)
        │
        ├── 4. Encapsulate Use Cases (Orchestration in Application Services)
        │
        └── 5. Implement Adapters & Composition Root (Dependency Injection)
```

---

## 2. Core Architectural Patterns

### 2.1 The Repository Pattern
Decouples domain logic from persistence mechanisms (SQL, ORM, NoSQL, memory).
- Domain layer defines the `Repository` interface.
- Infrastructure layer implements the interface with the concrete database driver.
- Domain operations query and persist entire aggregate roots.

### 2.2 Factory & Builder Patterns
Isolates complex object creation, invariant validation, and reconstitution logic from the consumer.
- Prevents leaking instantiation details into business use cases.
- Guarantees valid domain state upon instantiation.

### 2.3 Dependency Inversion Principle (DIP) & Ports and Adapters
- **Dependency Rule**: Source code dependencies must point inwards only. The inner core (Domain & Use Cases) must know nothing of the outer rings (Databases, HTTP frameworks, third-party SDKs).
- **Inversion of Control (IoC)**: Inject dependencies through class constructors rather than instantiating them via `new` inside methods.

---

## 3. Comprehensive End-to-End Case Study: Order Management

### 3.1 The Legacy Monolithic "God Class" (Before)
```typescript
// LEGACY GOD CLASS: Tightly coupled, untestable, violates all SOLID principles
import { Pool } from 'pg';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

export class OrderManager {
  private db: Pool;
  private stripe: Stripe;
  private mailer: any;

  constructor() {
    this.db = new Pool({ connectionString: process.env.DATABASE_URL });
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
    this.mailer = nodemailer.createTransport({ host: 'smtp.sendgrid.net' });
  }

  public async checkout(customerId: string, cartItems: any[], discountCode?: string): Promise<string> {
    // 1. Database validation & cart price computation
    let subtotal = 0;
    for (const item of cartItems) {
      const res = await this.db.query('SELECT price, stock FROM products WHERE id = $1', [item.productId]);
      const product = res.rows[0];
      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient inventory for product ${item.productId}`);
      }
      subtotal += product.price * item.quantity;
    }

    // 2. Discount business logic hardcoded
    let total = subtotal;
    if (discountCode === 'SUMMER20') {
      total = subtotal * 0.8;
    }

    // 3. Payment Gateway hardcoded dependency
    const charge = await this.stripe.charges.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      customer: customerId,
    });

    if (charge.status !== 'succeeded') {
      throw new Error('Payment processing failed');
    }

    // 4. Persistence logic
    const orderRes = await this.db.query(
      'INSERT INTO orders (customer_id, total, transaction_id, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [customerId, total, charge.id, 'PAID']
    );
    const orderId = orderRes.rows[0].id;

    for (const item of cartItems) {
      await this.db.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }

    // 5. Notification logic
    const customerRes = await this.db.query('SELECT email FROM customers WHERE id = $1', [customerId]);
    const email = customerRes.rows[0]?.email;
    if (email) {
      await this.mailer.sendMail({
        to: email,
        subject: `Order #${orderId} Confirmed`,
        text: `Your payment of $${total} was successful.`,
      });
    }

    return orderId;
  }
}
```

---

### 3.2 Refactored: Clean Architecture & SOLID Decoupling (After)

#### Layer 1: Pure Domain Layer (Entities & Value Objects)
```typescript
// domain/entities/order.ts
export interface OrderItem {
  readonly productId: string;
  readonly unitPrice: number;
  readonly quantity: number;
}

export class Order {
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly items: readonly OrderItem[],
    public readonly totalAmount: number,
    public readonly paymentTransactionId: string,
    public readonly status: 'PENDING' | 'PAID' | 'FAILED',
    public readonly createdAt: Date
  ) {}

  public static create(
    id: string,
    customerId: string,
    items: OrderItem[],
    discountPercentage: number = 0,
    paymentTransactionId: string
  ): Order {
    if (items.length === 0) {
      throw new Error('An order must contain at least one item');
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = Number((subtotal * (1 - discountPercentage / 100)).toFixed(2));

    return new Order(id, customerId, [...items], total, paymentTransactionId, 'PAID', new Date());
  }
}
```

#### Layer 2: Domain Ports (Contracts / Interfaces)
```typescript
// domain/ports/order-repository.port.ts
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(orderId: string): Promise<Order | null>;
}

// domain/ports/inventory-service.port.ts
export interface ProductInventory {
  readonly productId: string;
  readonly price: number;
  readonly availableStock: number;
}

export interface InventoryGateway {
  getInventory(productIds: string[]): Promise<Map<string, ProductInventory>>;
  decrementStock(items: { productId: string; quantity: number }[]): Promise<void>;
}

// domain/ports/payment-gateway.port.ts
export interface PaymentResult {
  readonly transactionId: string;
  readonly successful: boolean;
}

export interface PaymentGateway {
  charge(customerId: string, amount: number): Promise<PaymentResult>;
}

// domain/ports/notification-service.port.ts
export interface NotificationService {
  sendOrderConfirmation(customerId: string, orderId: string, total: number): Promise<void>;
}
```

#### Layer 3: Application Use Case (Single Responsibility Orchestrator)
```typescript
// application/use-cases/checkout.use-case.ts
export interface CheckoutCommand {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  discountCode?: string;
}

export class CheckoutUseCase {
  constructor(
    private readonly inventoryGateway: InventoryGateway,
    private readonly paymentGateway: PaymentGateway,
    private readonly orderRepository: OrderRepository,
    private readonly notificationService: NotificationService,
    private readonly idGenerator: () => string
  ) {}

  public async execute(command: CheckoutCommand): Promise<string> {
    const productIds = command.items.map(i => i.productId);
    const inventoryMap = await this.inventoryGateway.getInventory(productIds);

    // Verify stock and construct domain items
    const domainItems: OrderItem[] = command.items.map(item => {
      const product = inventoryMap.get(item.productId);
      if (!product || product.availableStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
      return {
        productId: item.productId,
        unitPrice: product.price,
        quantity: item.quantity,
      };
    });

    // Calculate discount rate
    const discountRate = command.discountCode === 'SUMMER20' ? 20 : 0;
    const subtotal = domainItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const totalToCharge = Number((subtotal * (1 - discountRate / 100)).toFixed(2));

    // Process payment
    const payment = await this.paymentGateway.charge(command.customerId, totalToCharge);
    if (!payment.successful) {
      throw new Error('Payment was declined by payment gateway');
    }

    // Create Domain Aggregate
    const orderId = this.idGenerator();
    const order = Order.create(orderId, command.customerId, domainItems, discountRate, payment.transactionId);

    // Persist and deduct inventory
    await this.orderRepository.save(order);
    await this.inventoryGateway.decrementStock(command.items);

    // Dispatch asynchronous notification
    await this.notificationService.sendOrderConfirmation(order.customerId, order.id, order.totalAmount);

    return order.id;
  }
}
```

#### Layer 4: Infrastructure Adapters (Pluggable Implementations)
```typescript
// infrastructure/adapters/stripe-payment.adapter.ts
export class StripePaymentAdapter implements PaymentGateway {
  constructor(private readonly stripeClient: Stripe) {}

  async charge(customerId: string, amount: number): Promise<PaymentResult> {
    const charge = await this.stripeClient.charges.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: customerId,
    });
    return {
      transactionId: charge.id,
      successful: charge.status === 'succeeded',
    };
  }
}

// infrastructure/adapters/postgres-order.adapter.ts
export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly dbPool: Pool) {}

  async save(order: Order): Promise<void> {
    await this.dbPool.query(
      'INSERT INTO orders (id, customer_id, total, transaction_id, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [order.id, order.customerId, order.totalAmount, order.paymentTransactionId, order.status, order.createdAt]
    );
  }

  async findById(orderId: string): Promise<Order | null> {
    const res = await this.dbPool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return Order.create(row.id, row.customer_id, [], 0, row.transaction_id);
  }
}
```

---

## 4. Architectural Quality Checks & Assertions
Before completing any architectural refactoring, verify:
1. **Zero Domain Contamination**: Domain models do not import database drivers, web frameworks, or external APIs.
2. **Interface Isolation**: Each port serves a focused contract (ISP).
3. **Mockability**: Unit testing the use case requires zero database or network calls.
4. **Single Composition Root**: All dependencies are wired together in the application entrypoint (e.g. `container.ts` or `main.ts`).
