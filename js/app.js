(function(e){function t(t){for(var r,o,s=t[0],p=t[1],u=t[2],l=0,f=[];l<s.length;l++)o=s[l],Object.prototype.hasOwnProperty.call(a,o)&&a[o]&&f.push(a[o][0]),a[o]=0;for(r in p)Object.prototype.hasOwnProperty.call(p,r)&&(e[r]=p[r]);c&&c(t);while(f.length)f.shift()();return i.push.apply(i,u||[]),n()}function n(){for(var e,t=0;t<i.length;t++){for(var n=i[t],r=!0,s=1;s<n.length;s++){var p=n[s];0!==a[p]&&(r=!1)}r&&(i.splice(t--,1),e=o(o.s=n[0]))}return e}var r={},a={app:0},i=[];function o(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,o),n.l=!0,n.exports}o.m=e,o.c=r,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)o.d(n,r,function(t){return e[t]}.bind(null,r));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="/";var s=window["webpackJsonp"]=window["webpackJsonp"]||[],p=s.push.bind(s);s.push=t,s=s.slice();for(var u=0;u<s.length;u++)t(s[u]);var c=p;i.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},"034f":function(e,t,n){"use strict";n("85ec")},"56d7":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var r=n("2b0e"),a=n("7496"),i=n("b0af"),o=n("99d9"),s=n("8fea"),p=n("8654"),u=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"app"}},[n(a["a"],{attrs:{id:"inspire"}},[n(i["a"],[n(o["a"],[n(p["a"],{attrs:{"append-icon":"mdi-magnify",label:"Search",search:e.search,"single-line":"","hide-details":""},model:{value:e.search,callback:function(t){e.search=t},expression:"search"}})],1),n(s["a"],{staticClass:"elevation-1",attrs:{headers:e.headers,items:e.mappings,"items-per-page":-1,search:e.search},scopedSlots:e._u([{key:"item.mapping_set_id",fn:function(t){var r=t.item;return[n("a",{attrs:{target:"_blank",href:""+r.mapping_set_id}},[e._v(" "+e._s(r.mapping_set_id)+" ")])]}},{key:"item.mapping_set_group",fn:function(t){var n=t.item;return[e._v(" "+e._s(n.mapping_set_group)+" ")]}},{key:"item.registry_title",fn:function(t){var n=t.item;return[e._v(" "+e._s(n.registry_title)+" ")]}},{key:"item.license",fn:function(t){var r=t.item;return[n("a",{attrs:{target:"_blank",href:""+r.license}},[e._v(" "+e._s(r.license)+" ")])]}},{key:"item.mapping_provider",fn:function(t){var r=t.item;return[n("a",{attrs:{target:"_blank",href:""+r.mapping_provider}},[e._v(" "+e._s(r.mapping_provider)+" ")])]}},{key:"item.mapping_set_description",fn:function(t){var n=t.item;return[e._v(" "+e._s(n.mapping_set_description)+" ")]}}])})],1)],1)],1)},c=[],l=(n("159b"),n("bc3a")),f=n.n(l),d={name:"App",components:{},data:function(){return{search:"",mappings:[],headers:[{text:"ID",align:"start",sortable:!0,value:"mapping_set_id"},{value:"mapping_set_group",text:"Group",sortable:!0},{value:"mapping_set_title",text:"Title",sortable:!0},{value:"license",text:"License",sortable:!0},{value:"mapping_provider",text:"Mapping Provider",sortable:!0},{value:"mapping_set_description",text:"Mapping Set Description",sortable:!0}]}},mounted:function(){var e=this;f.a.get("https://raw.githubusercontent.com/mapping-commons/mapping-commons.github.io/refs/heads/main/data/mapping-data.json").then((function(t){var n=[];t.data.registries.forEach((function(e){n.push(null===e||void 0===e?void 0:e.mapping_sets)})),e.mappings=n.flat()}))}},m=d,_=(n("034f"),n("2877")),g=Object(_["a"])(m,u,c,!1,null,null,null),v=g.exports,h=n("2106"),b=n.n(h),y=n("5f5b"),x=n("b1e0"),k=(n("f9e3"),n("2dd8"),n("f309"));r["default"].use(k["a"]);var w=new k["a"]({});r["default"].use(y["a"]),r["default"].use(x["a"]),r["default"].use(b.a,f.a),r["default"].config.productionTip=!1,new r["default"]({vuetify:w,render:function(e){return e(v)}}).$mount("#app")},"85ec":function(e,t,n){}});
//# sourceMappingURL=app.302675e3.js.map