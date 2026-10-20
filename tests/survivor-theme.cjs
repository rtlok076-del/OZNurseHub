// The retired Survivor route now forwards to Ward Shift.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const old = fs.readFileSync('med-survivor/index.html', 'utf8');
assert.match(old, /location.replace\('\/shift-sim\/'\)/);
const page = fs.readFileSync('shift-sim/index.html', 'utf8');
assert.match(page, /src="\/theme.js"/);
assert.match(page, /data-theme-controls/);
assert.match(page, /v0.3.0\/app.js/);
assert.match(fs.readFileSync('shift-sim/v0.3.0/style.css','utf8'), /html\[data-theme=dark\]/);
console.log('PASS legacy redirect, shared appearance controls and versioned runtime');
