#!/usr/bin/env node
/**
 * PayMongo MCP Server
 * Model Context Protocol integration for PayMongo Payment Gateway (Philippines)
 */

const readline = require('readline');

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';
const SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';

const authHeader = `Basic ${Buffer.from(`${SECRET_KEY}:`).toString('base64')}`;

async function paymongoFetch(endpoint, options = {}) {
  const url = `${PAYMONGO_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok) {
      throw new Error(`PayMongo API Error (${res.status}): ${JSON.stringify(json.errors || json)}`);
    }
    return json;
  } catch (e) {
    if (!res.ok) {
      throw new Error(`PayMongo API Error (${res.status}): ${text}`);
    }
    return text;
  }
}

const TOOLS = [
  {
    name: 'paymongo_create_checkout',
    description: 'Create a PayMongo hosted checkout session for court bookings or products (supports GCash, Maya, Cards, QRPh, GrabPay).',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Amount in PHP (e.g. 300 for ₱300.00)' },
        description: { type: 'string', description: 'Description of the booking or item' },
        customerName: { type: 'string', description: 'Customer full name' },
        customerEmail: { type: 'string', description: 'Customer email' },
        customerPhone: { type: 'string', description: 'Customer phone number (e.g. 09171234567)' },
        bookingId: { type: 'string', description: 'Reference booking ID' },
        successUrl: { type: 'string', description: 'Redirect URL on payment completion' },
        cancelUrl: { type: 'string', description: 'Redirect URL on checkout cancellation' },
      },
      required: ['amount', 'description', 'customerName', 'customerEmail'],
    },
  },
  {
    name: 'paymongo_get_payment',
    description: 'Retrieve details and status of a payment by payment ID (e.g. pay_...).',
    inputSchema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', description: 'The PayMongo payment ID' },
      },
      required: ['paymentId'],
    },
  },
  {
    name: 'paymongo_list_payments',
    description: 'List recent PayMongo payments with amounts, statuses, and payment methods.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of payments to retrieve (default: 10)' },
      },
    },
  },
  {
    name: 'paymongo_list_webhooks',
    description: 'List all registered webhooks configured in the PayMongo account.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'paymongo_create_webhook',
    description: 'Register a webhook URL in PayMongo to receive real-time payment notifications.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The webhook endpoint URL (e.g. https://your-domain.com/api/webhooks/paymongo)' },
        events: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of event names to listen to (default: ["checkout_session.paid", "payment.paid"])',
        },
      },
      required: ['url'],
    },
  },
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'paymongo_create_checkout': {
      const amountCentavos = Math.round(Number(args.amount) * 100);
      const payload = {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: [
              {
                currency: 'PHP',
                amount: amountCentavos,
                name: args.description,
                quantity: 1,
              },
            ],
            payment_method_types: ['gcash', 'paymaya', 'card', 'grab_pay', 'dob', 'qrph'],
            success_url: args.successUrl || 'http://localhost:3000/booking/success',
            cancel_url: args.cancelUrl || 'http://localhost:3000/book',
            customer: {
              name: args.customerName,
              email: args.customerEmail,
              phone: args.customerPhone || undefined,
            },
            metadata: {
              booking_id: args.bookingId || '',
              customer_email: args.customerEmail,
            },
          },
        },
      };

      const result = await paymongoFetch('/checkout_sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        checkoutUrl: result.data.attributes.checkout_url,
        sessionId: result.data.id,
        status: result.data.attributes.status,
      };
    }

    case 'paymongo_get_payment': {
      const result = await paymongoFetch(`/payments/${args.paymentId}`, {
        method: 'GET',
      });
      return result.data;
    }

    case 'paymongo_list_payments': {
      const limit = args.limit || 10;
      const result = await paymongoFetch(`/payments?limit=${limit}`, {
        method: 'GET',
      });
      return result.data;
    }

    case 'paymongo_list_webhooks': {
      const result = await paymongoFetch('/webhooks', {
        method: 'GET',
      });
      return result.data;
    }

    case 'paymongo_create_webhook': {
      const events = args.events || ['checkout_session.paid', 'payment.paid'];
      const payload = {
        data: {
          attributes: {
            url: args.url,
            events,
          },
        },
      };

      const result = await paymongoFetch('/webhooks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        webhookId: result.data.id,
        url: result.data.attributes.url,
        secretKey: result.data.attributes.secret_key,
        events: result.data.attributes.events,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC stdio Handler
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  if (!line.trim()) return;

  let message;
  try {
    message = JSON.parse(line);
  } catch (e) {
    return;
  }

  const { id, method, params } = message;

  if (method === 'initialize') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'paymongo-mcp-server',
          version: '1.0.0',
        },
      },
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  } else if (method === 'notifications/initialized') {
    // No-op for initialized notification
  } else if (method === 'tools/list') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS,
      },
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  } else if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      const output = await handleToolCall(name, args || {});
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2),
            },
          ],
        },
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (err) {
      const response = {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: err.message,
        },
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } else {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }
});
