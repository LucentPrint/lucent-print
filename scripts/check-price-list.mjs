// Regression checks for the September 2026 price list. No network or live order writes.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const runtimeRequire=createRequire(import.meta.url);
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const cache = new Map();
function load(file, mocks = {}) {
  if (cache.has(file) && !Object.keys(mocks).length) return cache.get(file);
  const context = { exports: {}, File, console, process: { env: { STRIPE_API_KEY: 'local-test-only', NEXT_PUBLIC_SITE_URL: 'http://localhost:3104' } }, require(name) {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/') || name.startsWith('.')) {
      const target = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(file), name);
      return load(target + '.ts', mocks);
    }
    return runtimeRequire(name);
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, context);
  if (!Object.keys(mocks).length) cache.set(file, context.exports);
  return context.exports;
}
const p = load('lib/custom-pricing.ts');
for (const [method, size, layout, quantity, expected] of [
  ['sublimation','S','front',1,22.99],['sublimation','S','back',1,24.99],['sublimation','S','large-front',1,24.99],['sublimation','S','front-back',1,27.99],
  ['sublimation','YXS','front',1,18.99],['sublimation','YXL','back',1,19.99],['sublimation','YS','front-back',1,23.99],
  ['sublimation','S','front',12,15],['sublimation','S','front-back',12,20],['sublimation','YS','front',12,13],['sublimation','YS','front-back',12,17],
  ['heat-transfer','S','front',1,18.99],['heat-transfer','S','back',1,18.99],['heat-transfer','S','front-back',1,24.99],
  ['heat-transfer','YS','front',1,15.99],['heat-transfer','YXL','back',1,15.99],['heat-transfer','YS','front-back',1,20.99],
  ['heat-transfer','S','front',12,12],['heat-transfer','S','front-back',12,17],['heat-transfer','YS','front',12,10],['heat-transfer','YS','front-back',12,14],
  ['heat-transfer','2XL','front',1,21.99],['sublimation','3XL','front-back',12,25],
  ['heat-transfer','S','front',11,18.99],['sublimation','S','back',12,24.99],['heat-transfer','S','large-front',1,null],
]) assert.equal(p.shirtUnitPrice(method,size,layout,quantity),expected,JSON.stringify([method,size,layout,quantity]));
assert.equal(p.shirtUnitPrice('heat-transfer','S','front',12,'customer'),13);
assert.equal(p.shirtUnitPrice('heat-transfer','3XL','front-back',1,'customer'),20);
assert.equal(p.shirtUnitPrice('sublimation','S','front',1,'customer'),null);
const input = {method:'heat-transfer',quantities:{S:6,YS:4,'2XL':2},placements:['Front — full chest'],supply:'lucent',garment:'tshirt',artwork:'design'};
assert.equal(p.customShirtEstimate(input).total,157); // 6×12 + 4×10 + 2×15 + $15 design, once.
assert.equal(p.customShirtEstimate({...input,artwork:'complex'}).total,null);
assert.equal(p.customShirtEstimate({...input,garment:'hoodie'}).total,null);
assert.equal(p.customShirtEstimate({...input,placements:['Sleeve']}).total,null);
assert.equal(p.customShirtEstimate({...input,method:'sublimation',placements:['Large front']}).total,null); // youth large front not listed
assert.equal(p.DRINKWARE.map(d=>`${d.price}/${d.bulkMinimum}/${d.bulkPrice}`).join(','),'24.99/10/18,24.99/10/18,19.99/12/14,17.99/12/12');
let inserted, stripeSession;
const product = {id:'2c062051-b9f0-495c-b193-d8189f82f1a7',slug:'inspirada-bulldogs-custom-shirt',name:'Inspirada Bulldogs Custom Shirt',price:24.99,status:'active',inventory:50,category:'Custom Shirts',material:'Cotton',collection:'Custom Apparel',images:[]};
const client = {auth:{getUser:async()=>({data:{user:null}})},from:()=>({insert:async(data)=>{inserted=data;return {error:null};}})};
const mocks = {'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},'@/lib/supabase/server':{createClient:async()=>client},'@/lib/supabase/admin':{createAdminClient:()=>client},'@/lib/data':{getProducts:async()=>[product]},stripe:class Stripe {constructor(){this.checkout={sessions:{create:async(data)=>{stripeSession=data;return {url:'https://example.invalid/test-checkout'};}}};}}};
async function run() {
 const route=load('app/api/custom-orders/route.ts',mocks);
 async function send(method,color,extra={}){inserted=null;const form=new FormData();Object.entries({name:'Local test',email:'test@example.invalid',phone:'test',description:'Local test',print_method:method,shirt_color:color,shirt_supply:'lucent',garment_type:'tshirt',artwork_status:'design',personalization:'individual',size_run:JSON.stringify(input.quantities),placements:JSON.stringify(input.placements),...extra}).forEach(([k,v])=>form.set(k,v));return route.POST({formData:async()=>form});}
 assert.equal((await send('heat-transfer','Black')).status,200);assert.equal(inserted.estimate,157);
 assert.equal((await send('sublimation','White',{size_run:'{"S":1}'})).status,200);assert.equal(inserted.estimate,37.99);
 assert.equal((await send('sublimation','Black')).status,400);assert.equal(inserted,null);
 for(const size_run of ['null','[]','{"S":-1}','{"S":1.5}','{"INVALID":2}'])assert.equal((await send('heat-transfer','Black',{size_run})).status,400);
 assert.equal((await send('heat-transfer','Black',{garment_type:'hoodie'})).status,200);assert.equal(inserted.estimate,null);
 const checkout=load('app/api/checkout/stripe/route.ts',mocks);
 const items=[{id:product.id,quantity:6,selectedColor:'S'},{id:product.id,quantity:4,selectedColor:'YS'},{id:product.id,quantity:2,selectedColor:'2XL'}];
 assert.equal((await checkout.POST({json:async()=>({items,paymentPlan:'full'})})).status,200);
 assert.equal(stripeSession.line_items.map(l=>l.price_data.unit_amount).join(','),'1700,1400,2000');
 assert.equal(stripeSession.metadata.full_order_total,'198.00');
 assert.equal((await checkout.POST({json:async()=>({items,paymentPlan:'deposit',promoCode:'LUCENTP'})})).status,200);
 assert.equal(stripeSession.line_items.map(l=>l.price_data.unit_amount).join(','),'850,700,1000');
 assert.equal(stripeSession.metadata.apparel_balance_due,'99.00');
 assert.equal((await checkout.POST({json:async()=>({items:[{id:product.id,quantity:1,selectedColor:'4XL'}]})})).status,400);
 assert.equal((await checkout.POST({json:async()=>({items:[{id:product.id,quantity:30,selectedColor:'S'},{id:product.id,quantity:30,selectedColor:'M'}]})})).status,400);
 console.log('PASS: PDF price rows, team thresholds, mixed sizes, size add-ons, BYO, one design fee, included personalization, quote-only options, request validation, Stripe totals/deposits/promo and inventory. All services mocked; no live orders or payments.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
