// End-to-end test of the buy → pay flow against the LIVE server.
const API = 'https://hasanalmahmud-b13-a10-server.vercel.app';

const post = async (path, body, token) => {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const get = async (path, token) => {
  const res = await fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};

(async () => {
  const buyerEmail = 'rakib.test@resellhub.com';
  let pass = 0, fail = 0;
  const check = (name, ok, extra = '') => { console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`); ok ? pass++ : fail++; };

  // 0. ensure buyer exists
  await post('/api/users', { name: 'Rakib Test', email: buyerEmail, role: 'buyer' });

  // 1. JWT
  const jwt = await post('/api/auth/jwt', { email: buyerEmail });
  check('Issue JWT', jwt.status === 200 && !!jwt.data.token);
  const token = jwt.data.token;

  // 2. list products, pick one
  const list = await get('/api/products?limit=1');
  check('List products', list.status === 200 && list.data.products?.length > 0, `total=${list.data.total}`);
  const product = list.data.products[0];

  // 3. create order
  const order = await post('/api/orders', { productId: product._id, quantity: 1 }, token);
  check('Create order', order.status === 200 && !!order.data.orderId);
  const orderId = order.data.orderId;

  // 4. stripe payment intent
  const intent = await post('/api/payments/create-payment-intent', { amount: product.price }, token);
  check('Stripe payment intent', intent.status === 200 && !!intent.data.clientSecret, intent.data.clientSecret ? 'clientSecret OK' : JSON.stringify(intent.data));

  // 5. save payment
  const txn = 'TEST_TXN_' + Date.now();
  const payment = await post('/api/payments', { orderId, transactionId: txn, amount: product.price, paymentMethod: 'card', buyerEmail }, token);
  check('Save payment + mark order paid', payment.status === 200 && !!payment.data.insertedId);

  // 6. verify order is paid
  const myOrders = await get('/api/orders/my-orders', token);
  const paidOrder = myOrders.data.find?.((o) => o._id === orderId);
  check('Order now paid + processing', paidOrder?.paymentStatus === 'paid' && paidOrder?.orderStatus === 'processing');

  // 7. payment history
  const history = await get('/api/payments/my-payments', token);
  check('Payment appears in history', Array.isArray(history.data) && history.data.some((p) => p.transactionId === txn));

  // 8. protected route without token -> 401
  const noAuth = await get('/api/orders/my-orders');
  check('Private API rejects no-token (401)', noAuth.status === 401);

  // 9. role guard: buyer hitting admin route -> 403
  const adminTry = await get('/api/users', token);
  check('Role guard blocks buyer from admin API (403)', adminTry.status === 403);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
