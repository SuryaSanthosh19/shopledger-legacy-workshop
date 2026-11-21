'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

test('invoice uses the billed HSN GST rate and matches the order total', function () {
  // This is the line shape created by routes/orders.js: HSN is stored, but gstRate is not.
  var items = [{ id: 1, sku: 'RICE-1', name: 'Rice', hsn: '1006', price: 100, qty: 2 }];
  var billed = pricing.computeTotals(items, '');
  var order = {
    id: 1001,
    items: items,
    coupon: '',
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };
  var figures = invoice.computeInvoiceFigures(order);
  var html = invoice.render(order);

  assert.deepEqual(
    { subtotal: billed.subtotal, tax: billed.tax, total: billed.total },
    { subtotal: 200, tax: 10, total: 210 }
  );
  assert.deepEqual(
    { subtotal: figures.subtotal, tax: figures.tax, cgst: figures.cgst, sgst: figures.sgst, total: figures.total },
    { subtotal: billed.subtotal, tax: billed.tax, cgst: billed.cgst, sgst: billed.sgst, total: billed.total }
  );
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 10);
  assert.doesNotMatch(html, /differs from Order Ledger recorded total/);
});

test('invoice uses the billed coupon discount and tax totals', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 }];
  var billed = pricing.computeTotals(items, 'WELCOME');
  var order = { items: items, coupon: 'WELCOME', total: billed.total };
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { discount: billed.discount, tax: billed.tax, total: billed.total },
    { discount: 10, tax: 9.5, total: 199.5 }
  );
  assert.deepEqual(
    { discount: figures.discount, tax: figures.tax, total: figures.total },
    { discount: billed.discount, tax: billed.tax, total: billed.total }
  );
});
