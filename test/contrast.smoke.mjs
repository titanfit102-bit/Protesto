import assert from "node:assert/strict";

/**
 * Browser-computed WCAG text contrast smoke for explicitly selected,
 * visible normal-size labels. It does not certify full WCAG or account for
 * background images, filters, canvas, pseudo-content or screen readers.
 */
export async function checkTextContrast(page,label,selectors){
 const results=await page.evaluate(requested=>{
  const issues=[];
  const normalize=rgb=>{
   const nums=rgb.match(/[\\d.]+/g)?.map(Number);
   return nums&&nums.length>=3?[nums[0],nums[1],nums[2],nums.length>3?nums[3]:1]:null;
  };
  const composite=(top,bottom)=>{
   const a=top[3];
   return top.slice(0,3).map((v,i)=>v*a+bottom[i]*(1-a));
  };
  const luminance=channels=>{
   const t=channels.map(v=>{
    const z=v/255;
    return z<=0.04045?z/12.92:((z+0.055)/1.055)**2.4;
   });
   return 0.2126*t[0]+0.7152*t[1]+0.0722*t[2];
  };
  const contrast=(a,b)=>{
   const x=luminance(a),y=luminance(b);
   return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
  };
  const effectiveBg=element=>{
   let bg=[255,255,255];
   const chain=[];
   for(let node=element;node;node=node.parentElement)chain.unshift(node);
   for(const node of chain){
    const parsed=normalize(getComputedStyle(node).backgroundColor);
    if(parsed)bg=composite(parsed,bg);
   }
   return bg;
  };
  for(const selector of requested){
   const nodes=[...document.querySelectorAll(selector)].filter(el=>{
    const css=getComputedStyle(el);
    return el.getClientRects().length>0&&css.display!=="none"&&css.visibility==="visible"&&
     css.opacity!=="0"&&el.textContent.trim().length>0;
   });
   if(!nodes.length){
    issues.push(selector+": no visible text element");
    continue;
   }
   for(const node of nodes){
    const css=getComputedStyle(node);
    const foreground=normalize(css.color);
    if(!foreground){issues.push(selector+": unsupported foreground color");continue;}
    const background=effectiveBg(node);
    const ratio=contrast(composite(foreground,background),background);
    // These contracted labels are normal-size text, even when inside links
    // and buttons; require >=4.5:1 rather than granting logo/large exemptions.
    if(ratio<4.5-0.001){
     issues.push(selector+": "+ratio.toFixed(2)+":1 (required 4.5:1)");
    }
   }
  }
  return issues;
 },selectors);
 assert.deepEqual(results,[],label+" computed WCAG AA contrast: "+results.join("; "));
}
