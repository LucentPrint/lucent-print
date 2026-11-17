import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import Stripe from "stripe";
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


const {holidaySchema,holidaySubtotal,holidaySummary,HOLIDAY_PAYMENTS_READY}=loadSource('lib/holiday-gifts.ts');
const valid={bundle:'set',design:'custom',quantity:1,wording:'Lu',colors:'Blue',details:'Matching birthday set',shirtSize:'',neededBy:'',fulfillment:'discuss'};
test('exact approved prices',()=>{assert.equal(holidaySubtotal(valid),2500);assert.equal(holidaySubtotal({...valid,bundle:'shirt',quantity:2}),9000);assert.equal(holidaySubtotal({...valid,bundle:'complete'}),5000)});
test('validation rejects price injection and invalid quantities',()=>{for(const value of [{...valid,price:1},{...valid,quantity:0},{...valid,quantity:1.1},{...valid,quantity:51},{...valid,bundle:'fake'},{...valid,details:'a'}])assert.equal(holidaySchema.safeParse(value).success,false)});
test('shirts require size; base disallows stale size',()=>{assert.equal(holidaySchema.safeParse({...valid,bundle:'shirt'}).success,false);assert.equal(holidaySchema.safeParse({...valid,bundle:'shirt',shirtSize:'XL'}).success,true);assert.equal(holidaySchema.safeParse({...valid,shirtSize:'XL'}).success,false)});
test('summary preserves customization without false payment claim',()=>{const text=holidaySummary({...valid,wording:'Coach Matt',colors:'Green',quantity:2});assert.match(text,/Coach Matt/);assert.match(text,/Green/);assert.match(text,/50.00/);assert.match(text,/requires confirmation/);assert.equal(HOLIDAY_PAYMENTS_READY,false)});
const {POST}=loadSource('app/api/holiday-gifts/checkout/route.ts');
function request(body,origin='https://lucent-print.vercel.app'){return new Request('https://lucent-print.vercel.app/api/holiday-gifts/checkout',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})}
test('review endpoint is explicitly not payment or submission',async()=>{const r=await POST(request(valid));assert.equal(r.status,200);const d=await r.json();assert.equal(d.paymentAvailable,false);assert.equal(d.requestSent,false);assert.equal(d.subtotalCents,2500);assert.equal(d.url,undefined)});
test('reject cross-origin, bad body, oversize and invalid details',async()=>{assert.equal((await POST(request(valid,'https://evil.example'))).status,403);assert.equal((await POST(request({...valid,quantity:-1}))).status,400);assert.equal((await POST(request({...valid,details:'a'.repeat(9000)}))).status,413)});
