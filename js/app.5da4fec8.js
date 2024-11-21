(function(e){function t(t){for(var n,p,s=t[0],o=t[1],c=t[2],l=0,f=[];l<s.length;l++)p=s[l],Object.prototype.hasOwnProperty.call(a,p)&&a[p]&&f.push(a[p][0]),a[p]=0;for(n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n]);u&&u(t);while(f.length)f.shift()();return i.push.apply(i,c||[]),r()}function r(){for(var e,t=0;t<i.length;t++){for(var r=i[t],n=!0,s=1;s<r.length;s++){var o=r[s];0!==a[o]&&(n=!1)}n&&(i.splice(t--,1),e=p(p.s=r[0]))}return e}var n={},a={app:0},i=[];function p(t){if(n[t])return n[t].exports;var r=n[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,p),r.l=!0,r.exports}p.m=e,p.c=n,p.d=function(e,t,r){p.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},p.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},p.t=function(e,t){if(1&t&&(e=p(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(p.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)p.d(r,n,function(t){return e[t]}.bind(null,n));return r},p.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return p.d(t,"a",t),t},p.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},p.p="/";var s=window["webpackJsonp"]=window["webpackJsonp"]||[],o=s.push.bind(s);s.push=t,s=s.slice();for(var c=0;c<s.length;c++)t(s[c]);var u=o;i.push([0,"chunk-vendors"]),r()})({0:function(e,t,r){e.exports=r("56d7")},"034f":function(e,t,r){"use strict";r("85ec")},"56d7":function(e,t,r){"use strict";r.r(t);r("e260"),r("e6cf"),r("cca6"),r("a79d");var n=r("2b0e"),a=r("7496"),i=r("b0af"),p=r("99d9"),s=r("8fea"),o=r("8654"),c=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("div",{attrs:{id:"app"}},[r(a["a"],{attrs:{id:"inspire"}},[r(i["a"],[r(p["a"],[r(o["a"],{attrs:{"append-icon":"mdi-magnify",label:"Search",search:e.search,"single-line":"","hide-details":""},model:{value:e.search,callback:function(t){e.search=t},expression:"search"}})],1),r(s["a"],{staticClass:"elevation-1",attrs:{headers:e.headers,items:e.mappings,"items-per-page":-1,search:e.search},scopedSlots:e._u([{key:"item.mapping_set_id",fn:function(t){var n=t.item;return[r("a",{attrs:{target:"_blank",href:""+n.mapping_set_id}},[e._v(" "+e._s(n.mapping_set_id)+" ")])]}},{key:"item.mapping_set_group",fn:function(t){var r=t.item;return[e._v(" "+e._s(r.mapping_set_group)+" ")]}},{key:"item.registry_title",fn:function(t){var r=t.item;return[e._v(" "+e._s(r.registry_title)+" ")]}},{key:"item.license",fn:function(t){var n=t.item;return[r("a",{attrs:{target:"_blank",href:""+n.license}},[e._v(" "+e._s(n.license)+" ")])]}},{key:"item.mapping_provider",fn:function(t){var n=t.item;return[r("a",{attrs:{target:"_blank",href:""+n.mapping_provider}},[e._v(" "+e._s(n.mapping_provider)+" ")])]}},{key:"item.mapping_set_description",fn:function(t){var r=t.item;return[e._v(" "+e._s(r.mapping_set_description)+" ")]}}])})],1)],1)],1)},u=[],l=r("5530"),f=(r("1276"),r("ac1f"),r("13d5"),r("4de4"),r("07ac"),r("2ca0"),r("5319"),r("159b"),r("bc3a")),d=r.n(f),m=r("b8ab"),_=r.n(m),g=r("369b"),v=r.n(g),h={name:"App",components:{},data:function(){return{search:"",mappings:[],headers:[{text:"ID",align:"start",sortable:!0,value:"mapping_set_id"},{value:"mapping_set_group",text:"Group",sortable:!0},{value:"registry_title",text:"Title",sortable:!0},{value:"license",text:"License",sortable:!0},{value:"mapping_provider",text:"Mapping Provider",sortable:!0},{value:"mapping_set_description",text:"Mapping Set Description",sortable:!0}]}},mounted:function(){var e=this,t={header:!0,delimiter:"\t",skipEmptyLines:!0},r=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:self,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"";try{var n=Array.isArray(e)?e:e.split("."),a=n.reduce((function(e,r){return t.filter((function(t){var n=Object.values(t)[0],a=n.startsWith(e)||n.startsWith(r);return a}))}));return Object.values(a[a.length-1])[0].replace(r,"")}catch(i){return""}};d.a.get("https://raw.githubusercontent.com/mapping-commons/mapping-commons.github.io/main/mapping-server.yml").then((function(n){var a=_.a.parse(n.data);a.registries=a.registries||[],a.registries.forEach((function(n){d.a.get(n.uri).then((function(n){var a=_.a.parse(n.data);a.mappings=a.mappings||[],a.mapping_set_references.forEach((function(n){d.a.get(n.mapping_set_id).then((function(i){v.a.parse(i.data,Object(l["a"])(Object(l["a"])({},t),{},{complete:function(t){var i={license:r("# curie_map.# license: ",t.data,"# license: "),creator_id:r("# creator_id:.",t.data,"# creator_id: "),mapping_provider:r("# curie_map.# mapping_provider:",t.data,"# mapping_provider: "),mapping_set_description:r("# curie_map.# mapping_set_description:",t.data,"# mapping_set_description: ")},p=Object.assign({},i,n,a);e.mappings.push(p)}}))}))}))}))}))}))}},b=h,y=(r("034f"),r("2877")),O=Object(y["a"])(b,c,u,!1,null,null,null),j=O.exports,k=r("2106"),x=r.n(k),w=r("5f5b"),P=r("b1e0"),S=(r("f9e3"),r("2dd8"),r("f309"));n["default"].use(S["a"]);var M=new S["a"]({});n["default"].use(w["a"]),n["default"].use(P["a"]),n["default"].use(x.a,d.a),n["default"].config.productionTip=!1,new n["default"]({vuetify:M,render:function(e){return e(j)}}).$mount("#app")},"85ec":function(e,t,r){}});
//# sourceMappingURL=app.5da4fec8.js.map