const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/mobile-responsive.html', 'utf8');
assert(!/<!doctype|<html|<head>|<body>/i.test(html));
assert(!/\\"|\\n/.test(html));
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
class Element {
  constructor(attributes = '') {
    this.dataset = {};
    for (const match of attributes.matchAll(/data-([\w-]+)(?:="([^"]*)")?/g)) this.dataset[match[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = match[2] ?? '';
    this.handlers = {};
    this.style = {};
  }
  addEventListener(name, handler) { this.handlers[name] = handler; }
}
class Phone extends Element {
  set innerHTML(value) {
    this.markup = value;
    this.elements = [...value.matchAll(/<(button|select|main)\b([^>]*)>/g)].map((match) => new Element(match[2]));
  }
  querySelectorAll(selector) {
    if (selector === '.llf-main') return [this.elements.find((element) => element.dataset.edition === undefined)];
    const [, key, value] = selector.match(/^\[data-([\w-]+)(?:="([^"]*)")?\]$/);
    const property = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return this.elements.filter((element) => property in element.dataset && (value === undefined || element.dataset[property] === value));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0]; }
}
const phones = [new Phone('data-design="list"'), new Phone('data-design="cards"')];
const root = { querySelectorAll: () => phones };
const stateCalls = [];
const sandbox = { document: { getElementById: (id) => { assert.equal(id, 'llf-mobile-preview'); return root; } }, window: { addEventListener() {}, openai: { setWidgetState: async (state) => { stateCalls.push(state); } } } };
vm.runInNewContext(script, sandbox, { timeout: 1000 });
for (const phone of phones) {
  assert(phone.markup.includes('Roblesfutsal1'));
  assert.equal(phone.querySelectorAll('[data-roster]').length, 4);
  phone.querySelector('[data-go="players"]').handlers.click();
  assert(phone.markup.includes('Sin jugadores en Menores'));
  phone.querySelector('[data-group="ADULT"]').handlers.click();
  assert(phone.markup.includes('Sin jugadores en Adultos'));
  phone.querySelector('[data-new]').handlers.click();
  assert(phone.markup.includes('No se guardan datos'));
  phone.querySelector('[data-back]').handlers.click();
  phone.querySelector('[data-go="squads"]').handlers.click();
  assert.equal(phone.querySelectorAll('[data-roster]').length, 1);
  phone.querySelector('[data-group="YOUTH"]').handlers.click();
  assert.equal(phone.querySelectorAll('[data-roster]').length, 3);
  phone.querySelector('[data-edition]').handlers.change({ target: { value: 'trimestre' } });
  assert.equal(phone.querySelectorAll('[data-roster]').length, 1);
  phone.querySelector('[data-roster="menores"]').handlers.click();
  assert(phone.markup.includes('Esta plantilla está vacía'));
  phone.querySelector('[data-back]').handlers.click();
  phone.querySelector('[data-go="home"]').handlers.click();
  assert.equal(phone.querySelectorAll('[data-roster]').length, 1);
  phone.querySelector('[data-edition]').handlers.change({ target: { value: 'all' } });
  assert.equal(phone.querySelectorAll('[data-roster]').length, 4);
  phone.querySelector('[data-theme]').handlers.click();
  assert.equal(phone.style.colorScheme, 'dark');
}
assert(stateCalls.length > 0);
console.log('PASS: ambas propuestas, navegación, Adultos/Menores, ediciones, plantillas y tema.');
console.log('Fragment size:', Buffer.byteLength(html), 'bytes');
