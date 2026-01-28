import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Input,
  Radio,
  Stack,
  Stepper,
  Text,
  type StepItem,
} from '@ui-kit/react';
import styles from './CheckoutFlow.module.css';

/**
 * # Checkout Flow
 *
 * An e-commerce checkout flow demonstrating the Stepper component
 * in a transactional context with error handling.
 *
 * ## Components Used
 * - **Stepper**: Checkout progress indicator
 * - **Input**: Form fields for address and payment
 * - **Radio**: Shipping option selection
 * - **Button**: Navigation and confirmation
 *
 * ## Stepper Features Demonstrated
 * - Error state for failed steps
 * - Disabled future steps
 * - Step descriptions for user guidance
 * - Compact size for constrained headers
 */

interface CartItem {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  price: number;
  variant: string;
}

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  days: string;
}

const cartItems: CartItem[] = [
  { id: '1', name: 'Wireless Headphones', emoji: '🎧', quantity: 1, price: 149.99, variant: 'Black' },
  { id: '2', name: 'USB-C Cable', emoji: '🔌', quantity: 2, price: 19.99, variant: '2m' },
  { id: '3', name: 'Phone Case', emoji: '📱', quantity: 1, price: 29.99, variant: 'Clear' },
];

const shippingOptions: ShippingOption[] = [
  { id: 'standard', name: 'Standard Shipping', description: 'Delivered in 5-7 business days', price: 4.99, days: '5-7 days' },
  { id: 'express', name: 'Express Shipping', description: 'Delivered in 2-3 business days', price: 12.99, days: '2-3 days' },
  { id: 'overnight', name: 'Overnight Shipping', description: 'Delivered by tomorrow', price: 24.99, days: 'Next day' },
];

const paymentMethods = [
  { id: 'card', name: 'Credit Card', icon: '💳' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️' },
  { id: 'apple', name: 'Apple Pay', icon: '🍎' },
];

function CheckoutFlowPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [hasError, setHasError] = useState(false);

  const checkoutSteps: StepItem[] = [
    { label: 'Cart', description: 'Review items' },
    { label: 'Shipping', description: 'Delivery address' },
    { label: 'Payment', description: 'Payment method', status: hasError ? 'error' : undefined },
    { label: 'Confirm', description: 'Place order' },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = shippingOptions.find((o) => o.id === shippingMethod)?.price || 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleNext = () => {
    if (currentStep < checkoutSteps.length - 1) {
      setHasError(false);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setHasError(false);
      setCurrentStep(currentStep - 1);
    }
  };

  const simulateError = () => {
    setHasError(true);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className={styles.formPanel}>
            <h2 className={styles.formTitle}>Review Your Cart</h2>
            <div className={styles.summaryItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.itemImage}>{item.emoji}</div>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemMeta}>
                      {item.variant} × {item.quantity}
                    </div>
                  </div>
                  <div className={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className={styles.formPanel}>
            <h2 className={styles.formTitle}>Shipping Address</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>First Name</label>
                <Input placeholder="John" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Last Name</label>
                <Input placeholder="Doe" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Street Address</label>
              <Input placeholder="123 Main Street" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City</label>
                <Input placeholder="San Francisco" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ZIP Code</label>
                <Input placeholder="94102" />
              </div>
            </div>

            <h3 className={styles.formTitle} style={{ marginTop: 'var(--space-6)' }}>
              Shipping Method
            </h3>
            <div className={styles.shippingOptions}>
              {shippingOptions.map((option) => (
                <div
                  key={option.id}
                  className={`${styles.shippingOption} ${shippingMethod === option.id ? styles.shippingOptionSelected : ''}`}
                  onClick={() => setShippingMethod(option.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setShippingMethod(option.id);
                    }
                  }}
                >
                  <Radio
                    checked={shippingMethod === option.id}
                    onChange={() => setShippingMethod(option.id)}
                  />
                  <div className={styles.shippingContent}>
                    <div className={styles.shippingName}>{option.name}</div>
                    <div className={styles.shippingDescription}>{option.description}</div>
                  </div>
                  <div className={styles.shippingPrice}>${option.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.formPanel}>
            <h2 className={styles.formTitle}>Payment Method</h2>

            {hasError && (
              <div className={styles.errorBanner}>
                <span className={styles.errorIcon}>⚠️</span>
                <span>Payment declined. Please check your card details and try again.</span>
              </div>
            )}

            <div className={styles.paymentMethods}>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`${styles.paymentMethod} ${paymentMethod === method.id ? styles.paymentMethodSelected : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setPaymentMethod(method.id);
                    }
                  }}
                >
                  <span className={styles.paymentIcon}>{method.icon}</span>
                  <span className={styles.paymentName}>{method.name}</span>
                </div>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Card Number</label>
                  <Input placeholder="1234 5678 9012 3456" />
                </div>
                <div className={styles.cardFields}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cardholder Name</label>
                    <Input placeholder="John Doe" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Expiry</label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>CVC</label>
                    <Input placeholder="123" type="password" />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" size="sm" onClick={simulateError}>
                Simulate Error State
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.successPage}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>Order Confirmed!</div>
            <div className={styles.successDescription}>
              Thank you for your purchase. You will receive a confirmation email shortly.
            </div>
            <div className={styles.orderNumber}>#ORD-2024-38291</div>
            <div className={styles.successActions}>
              <Button variant="default">View Order</Button>
              <Button variant="primary">Continue Shopping</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = currentStep === checkoutSteps.length - 1;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span>ShopCo</span>
        </div>
        <div className={styles.secureIndicator}>
          <span className={styles.secureIcon}>🔒</span>
          <span>Secure Checkout</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.stepperHeader}>
            <Stepper
              steps={checkoutSteps}
              current={currentStep}
              orientation="horizontal"
              size="md"
            />
          </div>

          {isLastStep ? (
            renderStepContent()
          ) : (
            <div className={styles.contentGrid}>
              <div>
                {renderStepContent()}

                <div className={styles.navigation}>
                  <Button
                    variant="default"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    Back
                  </Button>
                  <Button variant="primary" onClick={handleNext}>
                    {currentStep === 2 ? 'Place Order' : 'Continue'}
                  </Button>
                </div>
              </div>

              <div className={styles.summaryPanel}>
                <h3 className={styles.summaryTitle}>Order Summary</h3>
                <div className={styles.summaryItems}>
                  {cartItems.map((item) => (
                    <div key={item.id} className={styles.summaryItem}>
                      <div className={styles.itemImage}>{item.emoji}</div>
                      <div className={styles.itemDetails}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemMeta}>Qty: {item.quantity}</div>
                      </div>
                      <div className={styles.itemPrice}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.summaryLine}>
                  <span className={styles.summaryLineLabel}>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span className={styles.summaryLineLabel}>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span className={styles.summaryLineLabel}>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/Stepper/Checkout Flow',
  component: CheckoutFlowPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building a Checkout Flow

This example demonstrates how to build an e-commerce checkout flow using the Stepper component with error handling.

### Key Patterns

#### Error State Handling
- Use the \`status: 'error'\` prop on individual steps to indicate failures
- Show contextual error messages within the step content
- Allow users to retry without losing their progress

#### Order Summary Sidebar
- Sticky positioning keeps summary visible while scrolling
- Real-time updates as users change options (shipping method)
- Clear breakdown of costs

#### Shipping Option Selection
- Visual cards for each option with radio selection
- Price and delivery time prominently displayed
- Selected state uses primary surface colors

#### Payment Method Tabs
- Icon-based selection for common payment methods
- Conditional form fields based on selection
- Card form follows standard layout patterns

### Stepper Props Used

| Prop | Value | Purpose |
|------|-------|---------|
| steps | dynamic | Includes error status when payment fails |
| orientation | horizontal | Fits checkout header layout |
| size | md | Standard size for visibility |

### Error State Example

\`\`\`tsx
const checkoutSteps = [
  { label: 'Cart' },
  { label: 'Shipping' },
  { label: 'Payment', status: hasError ? 'error' : undefined },
  { label: 'Confirm' },
];
\`\`\`

### Components Used

| Component | Purpose |
|-----------|---------|
| Stepper | Checkout progress |
| Input | Address and payment forms |
| Radio | Shipping option selection |
| Button | Navigation actions |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};

/**
 * Stepper showing payment error state
 */
export const WithErrorState: Story = {
  render: () => {
    const steps: StepItem[] = [
      { label: 'Cart', description: 'Review items' },
      { label: 'Shipping', description: 'Complete' },
      { label: 'Payment', description: 'Error', status: 'error' },
      { label: 'Confirm', description: 'Place order' },
    ];

    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
        <Stepper steps={steps} current={2} />
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'var(--danger-bg)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-fg)',
          }}
        >
          Payment declined. Please try again.
        </div>
      </div>
    );
  },
};

/**
 * Compact stepper for mobile layouts
 */
export const MobileCheckout: Story = {
  render: () => {
    const [current, setCurrent] = useState(1);
    const steps = [
      { label: 'Cart' },
      { label: 'Ship' },
      { label: 'Pay' },
      { label: 'Done' },
    ];

    return (
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          background: 'var(--base-bg)',
          minHeight: 600,
          border: '1px solid var(--base-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-3)',
            borderBottom: '1px solid var(--base-border)',
          }}
        >
          <Stepper steps={steps} current={current} size="sm" showNumbers={false} />
        </div>
        <div style={{ padding: 'var(--space-4)' }}>
          <Text weight="medium">{steps[current].label} Step</Text>
          <Stack direction="horizontal" gap="sm" style={{ marginTop: 'var(--space-6)' }}>
            <Button
              variant="default"
              size="sm"
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
              style={{ flex: 1 }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={current === 3}
              onClick={() => setCurrent((c) => c + 1)}
              style={{ flex: 1 }}
            >
              Next
            </Button>
          </Stack>
        </div>
      </div>
    );
  },
};

/**
 * Order confirmation with all steps complete
 */
export const OrderComplete: Story = {
  render: () => {
    const steps: StepItem[] = [
      { label: 'Cart' },
      { label: 'Shipping' },
      { label: 'Payment' },
      { label: 'Complete' },
    ];

    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
        <Stepper steps={steps} current={3} />
        <div
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            padding: '2rem',
            background: 'var(--soft-bg)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success-fg)',
              fontSize: '2rem',
            }}
          >
            ✓
          </div>
          <Text size="lg" weight="semibold">Order Confirmed!</Text>
          <Text color="soft" style={{ marginTop: '0.5rem' }}>
            Order #ORD-2024-38291
          </Text>
        </div>
      </div>
    );
  },
};
