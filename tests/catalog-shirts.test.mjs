import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const requireFromProject = createRequire(new URL("../package.json", import.meta.url));

// Compile the actual TypeScript source in memory. Keeping dependency overrides
// local to each load avoids a test framework, generated files, and live services.
function loadSource(entry, overrides = {}, environment = process.env) {
  const cache = new Map();
  function load(filename) {
    const absolute = path.resolve(root, filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const moduleRecord = { exports: {} };
    cache.set(absolute, moduleRecord);
    const { outputText } = ts.transpileModule(readFileSync(absolute, "utf8"), {
      fileName: absolute,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    });
    const localRequire = (specifier) => {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
      if (specifier.startsWith("@/")) return load(`${specifier.slice(2)}.ts`);
      if (specifier.startsWith(".")) {
        const dependency = path.resolve(path.dirname(absolute), specifier);
        return load(dependency.endsWith(".ts") ? dependency : `${dependency}.ts`);
      }
      return requireFromProject(specifier);
    };
    const compiled = new vm.Script(
      `(function(exports, require, module, __filename, __dirname, process) {\n${outputText}\n})`,
      { filename: absolute },
    ).runInThisContext();
    compiled(moduleRecord.exports, localRequire, moduleRecord, absolute, path.dirname(absolute), { env: environment });
    return moduleRecord.exports;
  }
  return load(entry);
}


const pricing = loadSource("lib/custom-pricing.ts");
const catalog = loadSource("lib/catalog-shirts.ts");
const promotions = loadSource("lib/promotions.ts");
const shirt = {id:"1583025c-a00f-4d9e-8686-cea973fd04fb",slug:"stay-wild-move-different-shirt",name:"Stay Wild Shirt",price:19.99,status:"active",inventory:100,images:[],category:"Shirts",collection:"Apparel",material:"",colors:[]};
const item = (size="S",quantity=1) => ({id:shirt.id,selectedColor:size,quantity,price:0.01,ageGroup:"kids"});
function stripeRoute(products=[shirt]) {
  const calls=[];
  class MockStripe { checkout={sessions:{create:async params=>{calls.push(params);return {url:"https://example.invalid/checkout"};}}}; }
  const route=loadSource("app/api/checkout/stripe/route.ts",{"stripe":MockStripe,"@/lib/data":{getProducts:async()=>products},"@/lib/supabase/server":{createClient:async()=>null}}, {STRIPE_API_KEY:"test-only",NEXT_PUBLIC_SITE_URL:"https://example.invalid"});
  return {calls,post:body=>route.POST(new Request("https://example.invalid/api/checkout/stripe",{method:"POST",body:JSON.stringify(body)}))};
}
test("actual shared pricing classifies every supported size and ignores product/client amounts",()=>{
 assert.equal(catalog.isCollectionShirt(shirt),true);
 for(const size of catalog.KIDS_SHIRT_SIZES)assert.equal(pricing.catalogUnitPrice({...shirt,price:0.01},size),20);
 for(const size of catalog.ADULT_SHIRT_SIZES)assert.equal(pricing.catalogUnitPrice({...shirt,price:0.01},size),25);
 for(const size of ["","adult","kids","YXXL","s","20"])assert.equal(catalog.collectionShirtPrice(size),null);
 assert.equal(pricing.catalogUnitPrice({...shirt,slug:"unrelated-tumbler",price:19.99},"S"),19.99);
 assert.equal(pricing.shirtUnitPrice("heat-transfer","3XL","front-back"),25);
});
test("Stripe uses authoritative adult/youth price and preserves shipping/tax configuration",async()=>{
 const {post,calls}=stripeRoute();assert.equal((await post({items:[item("S"),item("YS")]})).status,200);
 assert.deepEqual(calls[0].line_items.map(x=>x.price_data.unit_amount),[2500,2000]);
 assert.equal(calls[0].shipping_options[0].shipping_rate_data.fixed_amount.amount,695);
 assert.equal(calls[0].automatic_tax,undefined);
 assert.equal(calls[0].metadata.full_order_total,"51.95");
});
test("Stripe preserves free-shipping threshold and adult half-deposit balance",async()=>{
 const {post,calls}=stripeRoute();await post({items:[item("XL",3)],paymentPlan:"deposit"});
 assert.equal(calls[0].line_items[0].price_data.unit_amount,1250);
 assert.equal(calls[0].shipping_options[0].shipping_rate_data.fixed_amount.amount,0);
 assert.equal(calls[0].metadata.apparel_balance_due,"37.50");
});
test("Stripe rejects missing/tampered sizes before creating checkout",async()=>{
 for(const size of [undefined,"","kids","YXXL","s"]){const {post,calls}=stripeRoute();assert.equal((await post({items:[item(size===undefined?"S":size)].map(x=>size===undefined?{...x,selectedColor:undefined}:x)})).status,400);assert.equal(calls.length,0)}
});
test("Stripe preserves inventory and quantity validation",async()=>{
 for(const body of [{items:[item("S",0)]},{items:[item("S",1.5)]},{items:[item("S",99),item("YS",2)]}]){const {post,calls}=stripeRoute();assert.equal((await post(body)).status,400);assert.equal(calls.length,0)}
});
test("Bulldogs promotion still caps toddler price at 15, youth20/adult25",()=>{
 const p={...shirt,slug:"inspirada-bulldogs-custom-shirt",name:"Bulldogs"};
 assert.equal(promotions.promotionalUnitPrice(p,"2T","LUCENTP"),15);
 assert.equal(promotions.promotionalUnitPrice(p,"YS","LUCENTP"),20);
 assert.equal(promotions.promotionalUnitPrice(p,"3XL","LUCENTP"),25);
});
test("PayPal actual handler rejects size spoofing and charges server-calculated totals; no live requests",async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json(String(url).endsWith('/token')?{access_token:"mock"}:{id:"mock-order",links:[{rel:"approve",href:"https://example.invalid/approve"}]})};
 try {
 const route=loadSource("app/api/checkout/paypal/create/route.ts",{"@/lib/data":{getProducts:async()=>[shirt]}},{NEXT_PUBLIC_PAYPAL_CLIENT_ID:"mock",PAYPAL_CLIENT_SECRET:"mock",PAYPAL_ENV:"sandbox"});
 const post=items=>route.POST(new Request("https://example.invalid",{method:"POST",body:JSON.stringify({items})}));
 assert.equal((await post([item("YS"),item("S")])).status,200);
 const order=JSON.parse(calls.find(x=>String(x.url).endsWith('/orders')).options.body);
 assert.equal(order.purchase_units[0].amount.value,"45.00");
 assert.equal(order.purchase_units[0].amount.breakdown,undefined); // Existing PayPal adds no tax/shipping line.
 calls.length=0;assert.equal((await post([item("kids")])).status,400);assert.equal(calls.filter(x=>String(x.url).endsWith('/orders')).length,0);
 } finally {globalThis.fetch=original}
});

test("registered shirt classification survives incomplete catalog labels",async()=>{
 const p={...shirt,name:"Design",category:"Other",collection:"Lucent Print",material:""};
 const {post,calls}=stripeRoute([p]);assert.equal((await post({items:[item("YS")],paymentPlan:"deposit"})).status,200);assert.equal(calls[0].line_items[0].price_data.unit_amount,1000);
});

test("custom shirt planning uses approved base rates and quotes new artwork",()=>{
 for(const size of catalog.KIDS_SHIRT_SIZES)assert.equal(pricing.shirtUnitPrice("sublimation",size,"front-back"),20);
 for(const size of catalog.ADULT_SHIRT_SIZES)assert.equal(pricing.shirtUnitPrice("sublimation",size,"front-back"),25);
 const estimate=pricing.customShirtEstimate({method:"sublimation",quantities:{S:2},placements:["Front — full chest"],supply:"lucent",garment:"tshirt",artwork:"design"});
 assert.equal(estimate.setup,25);assert.equal(estimate.total,null);
});
