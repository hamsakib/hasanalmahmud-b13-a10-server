// End-to-end test of the auth + buy → pay flow against the LIVE server.
// Auth is handled by Better Auth: we sign in and use the returned bearer token
// (set-auth-token header) for the protected routes.
const API = 'https://hasanalmahmud-b13-a10-server.vercel.app';

const post = async (path, body, token) => {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})), headers: res.headers };
};
const get = async (path, token) => {
  const res = await fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};

(async () => {
  const buyer = { name: 'Rakib Test', email: 'rakib.test@resellhub.com', password: 'Rakib123' };
  let pass = 0, fail = 0;
  const check = (name, ok, extra = '') => { console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`); ok ? pass++ : fail++; };

  // 0. ensure buyer exists (ignore "already exists")
  await post('/api/auth/sign-up/email', { name: buyer.name, email: buyer.email, password: buyer.password, role: 'buyer' });

  // 1. sign in via Better Auth, grab the bearer token
  const signin = await post('/api/auth/sign-in/email', { email: buyer.email, password: buyer.password });
  const token = signin.headers.get('set-auth-token');
  check('Sign in (Better Auth)', signin.status === 200 && !!token);

  // 2. session resolves with the bearer token
  const me = await get('/api/auth/get-session', token);
  check('Get session', me.status === 200 && me.data?.user?.email === buyer.email, `role=${me.data?.user?.role}`);

  // 3. list products, pick one
  const list = await get('/api/products?limit=1');
  check('List products', list.status === 200 && list.data.products?.length > 0, `total=${list.data.total}`);
  const product = list.data.products[0];

  // 4. create order
  const order = await post('/api/orders', { productId: product._id, quantity: 1 }, token);
  check('Create order', order.status === 200 && !!order.data.orderId);
  const orderId = order.data.orderId;

  // 5. stripe payment intent
  const intent = await post('/api/payments/create-payment-intent', { amount: product.price }, token);
  check('Stripe payment intent', intent.status === 200 && !!intent.data.clientSecret, intent.data.clientSecret ? 'clientSecret OK' : JSON.stringify(intent.data));

  // 6. save payment
  const txn = 'TEST_TXN_' + Date.now();
  const payment = await post('/api/payments', { orderId, transactionId: txn, amount: product.price, paymentMethod: 'card', buyerEmail: buyer.email }, token);
  check('Save payment + mark order paid', payment.status === 200 && !!payment.data.insertedId);

  // 7. verify order is paid
  const myOrders = await get('/api/orders/my-orders', token);
  const paidOrder = myOrders.data.find?.((o) => o._id === orderId);
  check('Order now paid + processing', paidOrder?.paymentStatus === 'paid' && paidOrder?.orderStatus === 'processing');

  // 8. payment history
  const history = await get('/api/payments/my-payments', token);
  check('Payment appears in history', Array.isArray(history.data) && history.data.some((p) => p.transactionId === txn));

  // 9. protected route without token -> 401
  const noAuth = await get('/api/orders/my-orders');
  check('Private API rejects no-token (401)', noAuth.status === 401);

  // 10. role guard: buyer hitting admin route -> 403
  const adminTry = await get('/api/users', token);
  check('Role guard blocks buyer from admin API (403)', adminTry.status === 403);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
