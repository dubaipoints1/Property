import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const hub = readFileSync("src/pages/banks/[slug].astro", "utf8");
const shared = readFileSync("src/components/CardsIndexDeferredArt.astro", "utf8");
const loader = hub.match(/deferBankCardArt && <script is:inline>([\s\S]*?)<\/script>/)?.[1];

test("only the Emirates NBD hub defers its existing card images and retains the no-script images", () => {
  assert.match(hub, /const deferBankCardArt = bank.id === "emirates-nbd"/);
  assert.match(hub, /t.hasArt && \(deferBankCardArt \?/);
  assert.match(hub, /<CardsIndexDeferredArt\b/);
  assert.match(hub, /: <CardImage\b/);
  assert.match(shared, /<template data-cards-art-template><CardImage/);
  assert.match(shared, /<noscript><CardImage/);
  assert.ok(loader);
});

function art(){
  let rendered = 0;
  const fragment = {};
  const template = {
    content: { cloneNode: (deep: boolean) => { assert.equal(deep,true); return fragment; } },
    replaceWith(node: unknown){ assert.equal(node,fragment); rendered++; },
  };
  return {
    querySelector(s:string){ assert.equal(s,"template[data-cards-art-template]"); return rendered === 0 ? template : null; },
    count(){return rendered;},
  };
}

test("viewport-gating loads the same image only near the viewport; older browsers receive the fallback", () => {
  assert.ok(loader);
  const top = art(), lower = art();
  const observed: unknown[] = [], removed: unknown[] = [];
  let react: ((entries: { target: unknown; isIntersecting: boolean }[])=>void) | undefined;
  class Observer {
    constructor(fn: NonNullable<typeof react>, options: {rootMargin: string}){
      react = fn;
      assert.equal(options.rootMargin,"96px 0px");
    }
    observe(e: unknown){observed.push(e);}
    unobserve(e: unknown){removed.push(e);}
  }
  const document = { querySelectorAll: (s:string) => { assert.equal(s,"[data-enbd-card-art]"); return [top,lower]; } };
  runInNewContext(loader,{ document, window:{ IntersectionObserver:Observer }, IntersectionObserver:Observer });
  assert.deepEqual(observed,[top,lower]);
  assert.ok(react);
  react([{target:top,isIntersecting:true},{target:lower,isIntersecting:false}]);
  assert.equal(top.count(),1);
  assert.equal(lower.count(),0);
  assert.deepEqual(removed,[top]);
  react([{target:lower,isIntersecting:true}]);
  assert.equal(lower.count(),1);
  runInNewContext(loader,{ document:{querySelectorAll:()=>[top,lower]}, window:{} });
  assert.equal(top.count(),1);
  assert.equal(lower.count(),1);
  const fallback = art();
  runInNewContext(loader,{document:{querySelectorAll:()=>[fallback]},window:{}});
  assert.equal(fallback.count(),1);
});
