var l={exports:{}},c={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var x=window.React,m=Symbol.for("react.element"),y=Symbol.for("react.fragment"),w=Object.prototype.hasOwnProperty,N=x.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,E={key:!0,ref:!0,__self:!0,__source:!0};function p(t,e,n){var r,o={},s=null,a=null;n!==void 0&&(s=""+n),e.key!==void 0&&(s=""+e.key),e.ref!==void 0&&(a=e.ref);for(r in e)w.call(e,r)&&!E.hasOwnProperty(r)&&(o[r]=e[r]);if(t&&t.defaultProps)for(r in e=t.defaultProps,e)o[r]===void 0&&(o[r]=e[r]);return{$$typeof:m,type:t,key:s,ref:a,props:o,_owner:N.current}}c.Fragment=y;c.jsx=p;c.jsxs=p;l.exports=c;var h=l.exports,d={},f=window.ReactDOM;d.createRoot=f.createRoot,d.hydrateRoot=f.hydrateRoot;function j(t){const[e,n]=t;return e==="react"&&typeof n=="function"}function b(t,e,n,r){if(typeof n=="string"){if(!r)throw new Error("render is required");const s=[n,r];if(j(s)){const[a,R]=s;return Object.assign((_,u)=>class extends u.Widget.Widget{constructor(){super();const i=document.createElement("div");i.traverseNextNode=()=>null,this.element.appendChild(i),d.createRoot(i).render(h.jsx(R,{UI:u,devtoolsWindow:_,onTraverseNextNode:v=>(i.traverseNextNode=v,()=>i.traverseNextNode=()=>null)}))}},{id:t,type:a,title:e})}throw new Error("render must be a function")}const o=n;return o.id=t,o.title=e,o}function g(t){return t}export{b as a,d as c,g as d,h as j};
